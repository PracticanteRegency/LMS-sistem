from django.core.files.storage import default_storage
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

import os
import io
import tempfile
import cloudinary
import cloudinary.uploader
from django.core.files.uploadedfile import InMemoryUploadedFile
from .models import (
    Modulos, Lecciones, progresolecciones, progresoModulo, progresoCapacitaciones
)
from usuarios.models import Colaboradores

# Import opcional de pikepdf (solo si está disponible)
try:
    import pikepdf
    PIKEPDF_AVAILABLE = True
except ImportError:
    PIKEPDF_AVAILABLE = False
    print("⚠️ pikepdf no disponible, compresión de PDF deshabilitada")


"""
MÓDULO DE BATCHING PARA ENVÍO DE CORREOS (Rate-Limited)
=========================================================

Proporciona funciones para enviar correos masivos a más de 500 colaboradores
dividiendo en lotes de máximo 80 correos por email y respetando el límite
de GoDaddy de 500 emails/hora (se usa 450 como margen de seguridad).

IMPORTANTE: GoDaddy cuenta cada destinatario BCC como 1 email hacia el límite.

Para 1500 colaboradores:
  - 19 lotes de 80 destinatarios
  - Delay de ~640s (~10 min) entre lotes  
  - Tiempo total estimado: ~3.2 horas

Uso:
    from capacitaciones.utils import enviar_correo_batch
    
    enviar_correo_batch(
        correos=['email1@test.com', 'email2@test.com', ...],  # 1500+
        subject='Asunto',
        text_message='Texto plano',
        html_message='<html>...</html>'
        # delay_entre_lotes=None → calculado automáticamente
    )
"""

import time
import logging
from typing import List, Tuple
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Constantes de rate-limiting ──────────────────────────────────────────
# GoDaddy límite real: 500 emails/hora (cada BCC cuenta como 1 email)
EMAILS_PER_HOUR = 450   # Margen de 50 para emails de exámenes u otros módulos
BATCH_SIZE = 80          # Destinatarios BCC por email (era 500, reducido para seguridad)
DEFAULT_DELAY = 2        # Delay mínimo entre lotes (se ajusta automáticamente)


def _calcular_delay_entre_lotes(tamanio_lote: int, max_por_hora: int = EMAILS_PER_HOUR) -> float:
    """
    Calcula el delay necesario entre lotes para no exceder el límite por hora.

    GoDaddy cuenta cada destinatario BCC como 1 email → con lotes de 80,
    podemos enviar máximo 450/80 ≈ 5.6 lotes por hora.
    Delay = 3600 / 5.6 ≈ 640 segundos (~10.7 minutos) entre lotes.

    Args:
        tamanio_lote: Cantidad de destinatarios por lote
        max_por_hora: Límite de emails por hora del proveedor

    Returns:
        float: Segundos de pausa entre lotes
    """
    if tamanio_lote <= 0 or max_por_hora <= 0:
        return DEFAULT_DELAY
    lotes_por_hora = max_por_hora / tamanio_lote
    delay = 3600.0 / lotes_por_hora
    return max(delay, DEFAULT_DELAY)


def dividir_en_lotes(correos: List[str], tamanio_lote: int = BATCH_SIZE) -> List[List[str]]:
    """
    Divide una lista de correos en lotes de tamaño máximo.

    Args:
        correos: Lista de direcciones de email
        tamanio_lote: Máximo de correos por lote (default: 80)

    Returns:
        Lista de lotes
    """
    if not correos:
        return []

    lotes = []
    for i in range(0, len(correos), tamanio_lote):
        lote = correos[i:i+tamanio_lote]
        lotes.append(lote)

    return lotes


def enviar_correo_batch(
    correos: List[str],
    subject: str,
    text_message: str,
    html_message: str,
    delay_entre_lotes: int = None,
    from_email: str = None,
    fail_silently: bool = False,
    max_por_hora: int = EMAILS_PER_HOUR
) -> Tuple[int, int, List[str]]:
    """
    Envía un correo masivo a múltiples colaboradores dividiéndolos en lotes,
    respetando el límite de 500 emails/hora de GoDaddy.

    IMPORTANTE:
    - GoDaddy cuenta CADA destinatario BCC como 1 email hacia el límite/hora.
    - Con BATCH_SIZE=80 y max_por_hora=450, el delay entre lotes es ~640s (~10 min).
    - Para 1500 colaboradores: 19 lotes × 10 min ≈ 3.2 horas.
    - Filtra automáticamente usuarios desactivados (estadocolaborador != 1).

    Args:
        correos: Lista de direcciones de email (puede ser 1500+)
        subject: Asunto del email
        text_message: Cuerpo en texto plano
        html_message: Cuerpo en HTML
        delay_entre_lotes: Segundos de pausa entre envíos (None = calculado automático)
        from_email: Email del remitente (default: settings.DEFAULT_FROM_EMAIL)
        fail_silently: Si True, silencia excepciones; si False, las levanta
        max_por_hora: Límite de emails/hora del proveedor (default: 450)

    Returns:
        Tupla: (total_enviados, total_fallidos, lista_de_errores)
    """
    if not correos:
        logger.warning("enviar_correo_batch: Lista de correos vacía")
        return 0, 0, []

    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL

    # Validar emails válidos Y que el colaborador esté activo
    correos_validos = []
    usuarios_desactivados = 0

    for email_addr in correos:
        if not email_addr or '@' not in email_addr:
            continue

        colaborador_activo = Colaboradores.objects.filter(
            correocolaborador=email_addr,
            estadocolaborador=1
        ).exists()

        if not colaborador_activo:
            usuarios_desactivados += 1
            logger.debug(f"enviar_correo_batch: Email {email_addr} omitido (desactivado/no encontrado)")
            continue

        correos_validos.append(email_addr)

    if usuarios_desactivados > 0:
        logger.warning(f"enviar_correo_batch: {usuarios_desactivados} usuarios desactivados omitidos")

    # Dividir en lotes
    lotes = dividir_en_lotes(correos_validos, BATCH_SIZE)

    if not lotes:
        logger.error("enviar_correo_batch: No hay emails válidos después de validación")
        return 0, len(correos), ["No hay emails válidos o todos los usuarios están desactivados"]

    # Calcular delay respetando el límite por hora de GoDaddy
    if delay_entre_lotes is None:
        delay_real = _calcular_delay_entre_lotes(BATCH_SIZE, max_por_hora)
    else:
        delay_real = max(delay_entre_lotes, _calcular_delay_entre_lotes(BATCH_SIZE, max_por_hora))

    tiempo_estimado = delay_real * (len(lotes) - 1) if len(lotes) > 1 else 0

    logger.info(
        f"enviar_correo_batch: {len(correos_validos)} colaboradores activos → "
        f"{len(lotes)} lotes de {BATCH_SIZE} | "
        f"Delay entre lotes: {delay_real:.0f}s (~{delay_real/60:.1f} min) | "
        f"Tiempo estimado total: {tiempo_estimado/60:.1f} min | "
        f"Límite: {max_por_hora}/hora"
    )

    # Enviar por lotes con rate-limiting
    total_enviados = 0
    total_fallidos = 0
    errores = []

    for num_lote, lote in enumerate(lotes, 1):
        try:
            logger.info(
                f"  Lote {num_lote}/{len(lotes)}: Enviando a {len(lote)} "
                f"colaboradores (BCC)..."
            )

            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=from_email,
                to=[],
                bcc=lote
            )
            email.attach_alternative(html_message, "text/html")

            result = email.send(fail_silently=fail_silently)
            total_enviados += result

            logger.info(f"  Lote {num_lote}/{len(lotes)}: ✅ Enviado ({len(lote)} destinatarios)")

            # Pausa entre lotes (excepto en el último)
            if num_lote < len(lotes):
                logger.info(
                    f"  ⏳ Esperando {delay_real:.0f}s (~{delay_real/60:.1f} min) "
                    f"antes del lote {num_lote+1} para respetar límite GoDaddy..."
                )
                time.sleep(delay_real)

        except Exception as e:
            total_fallidos += 1
            error_msg = f"Lote {num_lote}: {str(e)}"
            errores.append(error_msg)
            logger.error(f"  Lote {num_lote}/{len(lotes)}: ❌ Error - {error_msg}")

            if not fail_silently:
                raise

    tasa_exito = (total_enviados / len(lotes) * 100) if lotes else 0
    logger.info(
        f"enviar_correo_batch: COMPLETADO - Enviados: {total_enviados}/{len(lotes)} lotes, "
        f"Fallidos: {total_fallidos}, Tasa éxito: {tasa_exito:.1f}%"
    )

    return total_enviados, total_fallidos, errores


def obtener_estadisticas_batching(num_colaboradores: int) -> dict:
    """
    Calcula estadísticas de batching para N colaboradores.
    Tiene en cuenta el límite de GoDaddy (450/hora efectivos).

    Ejemplo:
        stats = obtener_estadisticas_batching(1500)
        # 1500 / 80 = 19 lotes, delay ~640s → ~3.2 horas
    """
    num_lotes = (num_colaboradores + BATCH_SIZE - 1) // BATCH_SIZE
    delay_entre_lotes = _calcular_delay_entre_lotes(BATCH_SIZE, EMAILS_PER_HOUR)
    tiempo_envio_lote = 5  # segundos aprox de envío SMTP por lote

    tiempo_total = (num_lotes * tiempo_envio_lote) + (max(0, num_lotes - 1) * delay_entre_lotes)

    return {
        'num_colaboradores': num_colaboradores,
        'tamanio_lote': BATCH_SIZE,
        'max_por_hora': EMAILS_PER_HOUR,
        'num_lotes': num_lotes,
        'delay_entre_lotes_seg': round(delay_entre_lotes),
        'delay_entre_lotes_min': round(delay_entre_lotes / 60, 1),
        'tiempo_estimado_segundos': round(tiempo_total),
        'tiempo_estimado_minutos': round(tiempo_total / 60, 1),
        'tiempo_estimado_legible': f"{int(tiempo_total // 3600)}h {int((tiempo_total % 3600) // 60)}m"
    }


# ============================================================================
# FUNCIONES MEJORADAS PARA CAPACITACIONES (reemplazan a las originales)
# ============================================================================

def enviar_correo_capacitacion_creada_batch(capacitacion, colaboradores_ids=None):
    """
    Versión mejorada de enviar_correo_capacitacion_creada que soporta 1500+ colaboradores.
    
    Cambios principales:
    - Usa enviar_correo_batch() en lugar de email.send() directo
    - Divide automáticamente en lotes de 500
    - Registra estadísticas detalladas
    
    Args:
        capacitacion: Instancia de Capacitaciones
        colaboradores_ids: Lista de IDs de colaboradores (opcional)
    
    Returns:
        Diccionario con resultados: {
            'enviados': int,
            'fallidos': int,
            'total': int,
            'errores': list,
            'tasa_exito': float
        }
    """
    
    logger_local = logging.getLogger(__name__)
    
    try:
        # Obtener correos
        if colaboradores_ids:
            correos = list(
                Colaboradores.objects.filter(idcolaborador__in=colaboradores_ids)
                .values_list("correocolaborador", flat=True)
                .exclude(correocolaborador__isnull=True)
                .exclude(correocolaborador__exact="")
                .distinct()
            )
        else:
            correos = list(
                progresoCapacitaciones.objects.filter(capacitacion=capacitacion)
                .select_related('colaborador')
                .values_list("colaborador__correocolaborador", flat=True)
                .exclude(colaborador__correocolaborador__isnull=True)
                .exclude(colaborador__correocolaborador__exact="")
                .distinct()
            )
        
        if not correos:
            logger_local.warning(f"No hay colaboradores con email para capacitación {capacitacion.id}")
            return {
                'enviados': 0,
                'fallidos': 0,
                'total': 0,
                'errores': ['No hay colaboradores con email'],
                'tasa_exito': 0.0
            }
        
        # Preparar contenido
        subject = f"🎓 Capacitación: {capacitacion.titulo}"
        
        text_message = (
            f"Estimado colaborador,\n\n"
            f"Reciba un cordial saludo.\n"
            f"Nos complace informarle que ha sido matriculado en la formación '{capacitacion.titulo}'.\n\n"
            f"Fecha de inicio: {capacitacion.fecha_inicio.date()}\n"
            f"Fecha de finalización: {capacitacion.fecha_fin.date()}\n\n"
            f"Podrá acceder a la plataforma en: https://formacion.cloudregencyapps.com/login\n\n"
            f"Agradecemos su disposición e interés en fortalecer sus competencias.\n"
            f"Atentamente,\n\n"
            f"Área de Formación Empresarial"
        )
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <p>Estimado colaborador,</p>
            <p>Reciba un cordial saludo.</p>
            <p>
                Nos complace informarle que ha sido matriculado en la formación
                <strong>{capacitacion.titulo}</strong>. A continuación, encontrará los detalles:
            </p>
            <ul>
                <li><strong>Fecha de inicio:</strong> {capacitacion.fecha_inicio.date()}</li>
                <li><strong>Fecha de finalización:</strong> {capacitacion.fecha_fin.date()}</li>
            </ul>
            <p>
                Podrá acceder a la plataforma de formación a través del siguiente enlace:<br>
                <a href="https://formacion.cloudregencyapps.com/login" target="_blank">Acceder a la plataforma</a>
            </p>
            <p>
                Si olvidó su contraseña, puede restablecerla desde la plataforma.
            </p>
            <p>
                Agradecemos su disposición e interés en fortalecer sus competencias.<br>
                Le deseamos una experiencia de aprendizaje provechosa.
            </p>
            <p><strong>Atentamente,</strong><br>
            Área de Formación Empresarial</p>
        </body>
        </html>
        """
        
        # Enviar usando batch (rate-limiting automático: 450 emails/hora)
        enviados, fallidos, errores = enviar_correo_batch(
            correos=correos,
            subject=subject,
            text_message=text_message,
            html_message=html_message,
            fail_silently=False
        )
        
        total = len(correos)
        tasa_exito = (enviados / total * 100) if total > 0 else 0
        
        logger_local.info(
            f"Capacitación {capacitacion.id}: "
            f"Enviados={enviados}, Fallidos={fallidos}, Total={total}, "
            f"Tasa={tasa_exito:.1f}%"
        )
        
        return {
            'enviados': enviados,
            'fallidos': fallidos,
            'total': total,
            'errores': errores,
            'tasa_exito': tasa_exito
        }
    
    except Exception as e:
        logger_local.error(f"Error en enviar_correo_capacitacion_creada_batch: {str(e)}", exc_info=True)
        return {
            'enviados': 0,
            'fallidos': 1,
            'total': 0,
            'errores': [str(e)],
            'tasa_exito': 0.0
        }


def enviar_correo_cap_activada_batch(capacitacion, colaboradores_ids=None):
    """
    Versión mejorada de enviar_correo_cap_activada que soporta 1500+ colaboradores.
    """
    
    logger_local = logging.getLogger(__name__)
    
    try:
        if colaboradores_ids is None:
            correos_qs = progresoCapacitaciones.objects.filter(capacitacion=capacitacion, completada=False)
            correos = list(
                correos_qs.values_list("colaborador__correocolaborador", flat=True)
                .exclude(colaborador__correocolaborador__isnull=True)
                .exclude(colaborador__correocolaborador__exact="")
                .distinct()
            )
        else:
            provided_ids = list(map(int, colaboradores_ids))
            completed_ids = set(
                progresoCapacitaciones.objects.filter(
                    capacitacion=capacitacion,
                    colaborador_id__in=provided_ids,
                    completada=True
                ).values_list('colaborador_id', flat=True)
            )
            notify_ids = [pid for pid in provided_ids if pid not in completed_ids]
            
            correos = list(
                Colaboradores.objects.filter(idcolaborador__in=notify_ids)
                .values_list("correocolaborador", flat=True)
                .exclude(correocolaborador__isnull=True)
                .exclude(correocolaborador__exact="")
                .distinct()
            )
        
        if not correos:
            logger_local.warning(f"No hay colaboradores para activación de capacitación {capacitacion.id}")
            return {
                'enviados': 0,
                'fallidos': 0,
                'total': 0,
                'errores': ['No hay colaboradores con email'],
                'tasa_exito': 0.0
            }
        
        # Preparar contenido (mismo que enviar_correo_capacitacion_creada_batch)
        subject = f"🎓 Capacitación: {capacitacion.titulo}"
        
        text_message = (
            f"Estimado colaborador,\n\n"
            f"Reciba un cordial saludo.\n"
            f"Nos complace informarle que ha sido matriculado en la formación '{capacitacion.titulo}'.\n\n"
            f"Fecha de inicio: {capacitacion.fecha_inicio.date()}\n"
            f"Fecha de finalización: {capacitacion.fecha_fin.date()}\n\n"
            f"Podrá acceder a la plataforma en: https://formacion.cloudregencyapps.com/login\n\n"
            f"Agradecemos su disposición e interés en fortalecer sus competencias.\n"
            f"Atentamente,\n\n"
            f"Área de Formación Empresarial"
        )
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <p>Estimado colaborador,</p>
            <p>Reciba un cordial saludo.</p>
            <p>
                Nos complace informarle que ha sido matriculado en la formación
                <strong>{capacitacion.titulo}</strong>. A continuación, encontrará los detalles:
            </p>
            <ul>
                <li><strong>Fecha de inicio:</strong> {capacitacion.fecha_inicio.date()}</li>
                <li><strong>Fecha de finalización:</strong> {capacitacion.fecha_fin.date()}</li>
            </ul>
            <p>
                Podrá acceder a la plataforma de formación a través del siguiente enlace:<br>
                <a href="https://formacion.cloudregencyapps.com/login" target="_blank">Acceder a la plataforma</a>
            </p>
            <p>
                Si olvidó su contraseña, puede restablecerla desde la plataforma.
            </p>
            <p>
                Agradecemos su disposición e interés en fortalecer sus competencias.<br>
                Le deseamos una experiencia de aprendizaje provechosa.
            </p>
            <p><strong>Atentamente,</strong><br>
            Área de Formación Empresarial</p>
        </body>
        </html>
        """
        
        # Enviar usando batch (rate-limiting automático: 450 emails/hora)
        enviados, fallidos, errores = enviar_correo_batch(
            correos=correos,
            subject=subject,
            text_message=text_message,
            html_message=html_message,
            fail_silently=False
        )
        
        total = len(correos)
        tasa_exito = (enviados / total * 100) if total > 0 else 0
        
        logger_local.info(
            f"Capacitación activada {capacitacion.id}: "
            f"Enviados={enviados}, Fallidos={fallidos}, Total={total}, "
            f"Tasa={tasa_exito:.1f}%"
        )
        
        return {
            'enviados': enviados,
            'fallidos': fallidos,
            'total': total,
            'errores': errores,
            'tasa_exito': tasa_exito
        }
    
    except Exception as e:
        logger_local.error(f"Error en enviar_correo_cap_activada_batch: {str(e)}", exc_info=True)
        return {
            'enviados': 0,
            'fallidos': 1,
            'total': 0,
            'errores': [str(e)],
            'tasa_exito': 0.0
        }


def enviar_correo_nuevos_colaboradores(capacitacion_id, colaboradores_ids):
    """
    Envía correos SOLO a los nuevos colaboradores agregados a una capacitación activa.
    Función síncrona (NO es una task de Celery).
    Se ejecuta dentro de transaction.on_commit() para garantizar datos guardados.
    
    Args:
        capacitacion_id: ID de la capacitación
        colaboradores_ids: Lista de IDs de los colaboradores recién agregados
    
    Returns:
        Diccionario con estadísticas de envío
    """
    from capacitaciones.models import Capacitaciones
    from usuarios.models import Colaboradores
    
    logger_local = logging.getLogger(__name__)
    
    try:
        cap = Capacitaciones.objects.get(pk=capacitacion_id)
    except Capacitaciones.DoesNotExist:
        logger_local.error(f"enviar_correo_nuevos_colaboradores: Capacitación {capacitacion_id} no existe")
        return {
            'enviados': 0,
            'fallidos': 0,
            'total': 0,
            'errores': ['Capacitación no encontrada'],
            'tasa_exito': 0.0
        }
    
    if cap.estado != 1:
        logger_local.warning(f"enviar_correo_nuevos_colaboradores: Capacitación {capacitacion_id} no está activa")
        return {
            'enviados': 0,
            'fallidos': 0,
            'total': 0,
            'errores': ['Capacitación no está activa'],
            'tasa_exito': 0.0
        }
    
    correos = list(
        Colaboradores.objects.filter(
            idcolaborador__in=colaboradores_ids,
            estadocolaborador=1
        )
        .exclude(correocolaborador__isnull=True)
        .exclude(correocolaborador__exact="")
        .values_list("correocolaborador", flat=True)
        .distinct()
    )

    if not correos:
        logger_local.warning(f"enviar_correo_nuevos_colaboradores: No hay correos para colaboradores {colaboradores_ids}")
        return {
            'enviados': 0,
            'fallidos': 0,
            'total': 0,
            'errores': ['No hay correos válidos'],
            'tasa_exito': 0.0
        }

    logger_local.info(f"enviar_correo_nuevos_colaboradores: Enviando a {len(correos)} nuevos colaboradores para cap {capacitacion_id}")

    subject = f"🎓 Has sido asignado a: {cap.titulo}"

    text_message = (
        f"Estimado colaborador,\n\n"
        f"Reciba un cordial saludo.\n"
        f"Nos complace informarle que ha sido matriculado en la formación '{cap.titulo}'.\n\n"
        f"Fecha de inicio: {cap.fecha_inicio.date()}\n"
        f"Fecha de finalización: {cap.fecha_fin.date()}\n\n"
        f"Podrá acceder a la plataforma en: https://formacion.cloudregencyapps.com/login\n\n"
        f"Agradecemos su disposición e interés en fortalecer sus competencias.\n"
        f"Atentamente,\n\n"
        f"Área de Formación Empresarial"
    )

    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Estimado colaborador,</p>
        <p>Reciba un cordial saludo.</p>
        <p>
            Nos complace informarle que ha sido matriculado en la formación
            <strong>{cap.titulo}</strong>. A continuación, encontrará los detalles:
        </p>
        <ul>
            <li><strong>Fecha de inicio:</strong> {cap.fecha_inicio.date()}</li>
            <li><strong>Fecha de finalización:</strong> {cap.fecha_fin.date()}</li>
        </ul>
        <p>
            Podrá acceder a la plataforma de formación a través del siguiente enlace:<br>
            <a href="https://formacion.cloudregencyapps.com/login" target="_blank">Acceder a la plataforma</a>
        </p>
        <p>
            Si olvidó su contraseña, puede restablecerla desde la plataforma.
        </p>
        <p>
            Agradecemos su disposición e interés en fortalecer sus competencias.<br>
            Le deseamos una experiencia de aprendizaje provechosa.
        </p>
        <p><strong>Atentamente,</strong><br>
        Área de Formación Empresarial</p>
    </body>
    </html>
    """

    # Enviar usando batch (rate-limiting automático: 450 emails/hora)
    enviados, fallidos, errores = enviar_correo_batch(
        correos=correos,
        subject=subject,
        text_message=text_message,
        html_message=html_message
    )
    
    total = len(correos)
    tasa_exito = (enviados / total * 100) if total > 0 else 0
    
    logger_local.info(
        f"Nuevos colaboradores {capacitacion_id}: "
        f"Enviados={enviados}, Fallidos={fallidos}, Total={total}, "
        f"Tasa={tasa_exito:.1f}%"
    )
    
    return {
        'enviados': enviados,
        'fallidos': fallidos,
        'total': total,
        'errores': errores,
        'tasa_exito': tasa_exito
    }



def actualizar_progreso_leccion(colaborador_id, leccion, progreso, completada):
    """
    Guarda o actualiza el progreso de una lección y luego recalcula módulo y capacitación.
    """
    # Convertir booleano a entero si es necesario
    completada_int = 1 if completada else 0
    
    defaults = {
        'progreso': progreso,
        'completada': completada_int
    }
    # Agregar fecha de completado si se completó
    if completada_int == 1:
        defaults['fecha_completado'] = timezone.now()
    
    progreso_leccion, _ = progresolecciones.objects.update_or_create(
        idcolaborador_id=colaborador_id,
        idleccion=leccion,
        defaults=defaults
    )

    progreso_modulo_data = actualizar_progreso_modulo(colaborador_id, leccion.idmodulo)
    return progreso_modulo_data


def actualizar_progreso_modulo(colaborador_id, modulo):
    """
    Calcula el promedio de progreso de todas las lecciones del módulo.
    
    BUG FIX #1: Módulos vacíos ahora retornan 0% de progreso y no se marcan como completados.
    Los módulos sin lecciones no deberían contar como completados automáticamente.
    """
    lecciones = Lecciones.objects.filter(idmodulo=modulo)
    total_lecciones = lecciones.count()
    
    # ✅ FIX #1: Si el módulo no tiene lecciones, no se puede completar
    if total_lecciones == 0:
        # Actualizar o crear el registro con 0% progreso
        progresoModulo.objects.update_or_create(
            colaborador_id=colaborador_id,
            modulo=modulo,
            defaults={
                'progreso': 0,
                'completada': 0,  # ✅ Explícitamente NO completado
                'fecha_completado': None
            }
        )
        logger.warning(
            f"⚠️  Módulo vacío (ID:{modulo.id}) para colaborador {colaborador_id} - "
            f"Progreso: 0%, Completada: 0"
        )
        return {"progreso_modulo": 0, "progreso_capacitacion": 0}

    progreso_total = 0
    completadas = 0

    for leccion in lecciones:
        progreso_leccion = progresolecciones.objects.filter(
            idcolaborador_id=colaborador_id,
            idleccion=leccion
        ).first()

        if progreso_leccion:
            progreso_total += float(progreso_leccion.progreso or 0)
            if progreso_leccion.completada == 1:
                completadas += 1

    promedio_modulo = round(progreso_total / total_lecciones, 2)
    modulo_completado = completadas == total_lecciones
    modulo_completado_int = 1 if modulo_completado else 0

    progreso_modulo, _ = progresoModulo.objects.update_or_create(
        colaborador_id=colaborador_id,
        modulo=modulo,
        defaults={
            'progreso': promedio_modulo,
            'completada': modulo_completado_int,
            'fecha_completado': timezone.now() if modulo_completado else None
        }
    )

    promedio_capacitacion = actualizar_progreso_capacitacion(colaborador_id, modulo.idcapacitacion)

    return {
        "progreso_modulo": promedio_modulo,
        "progreso_capacitacion": promedio_capacitacion
    }


def actualizar_progreso_capacitacion(colaborador_id, capacitacion):
    """
    Calcula el progreso general de una capacitación basado en sus módulos.
    
    BUG FIX #2: Ahora valida coherencia:
    - La capacitación solo se marca como completada si ALL módulos están completados
    - Se valida que no haya inconsistencias (completada=1 pero progreso_modulo=0)
    - Se limpia la fecha_completada si se descompleta
    """
    modulos = Modulos.objects.filter(idcapacitacion=capacitacion)
    total_modulos = modulos.count()
    
    if total_modulos == 0:
        return 0

    progreso_total = 0
    completados = 0
    progreso_por_modulo = {}  # Para auditoría

    for modulo in modulos:
        progreso_modulo = progresoModulo.objects.filter(
            colaborador_id=colaborador_id,
            modulo=modulo
        ).first()

        if progreso_modulo:
            progreso_value = float(progreso_modulo.progreso or 0)
            progreso_total += progreso_value
            progreso_por_modulo[modulo.id] = {
                'progreso': progreso_value,
                'completada': progreso_modulo.completada
            }
            
            # ✅ FIX #2: Validación de coherencia
            # Si módulo está marcado como completado, debe tener progreso >= 100
            if progreso_modulo.completada == 1:
                if progreso_value < 100:
                    # ❌ INCONSISTENCIA DETECTADA
                    logger.warning(
                        f"⚠️  INCONSISTENCIA DETECTADA: "
                        f"Módulo {modulo.id} marcado completada=1 pero progreso={progreso_value}% "
                        f"para colaborador {colaborador_id}. Corrigiendo..."
                    )
                    # Auto-corrección: marcar como no completado
                    progreso_modulo.completada = 0
                    progreso_modulo.fecha_completado = None
                    progreso_modulo.save(update_fields=['completada', 'fecha_completado'])
                    progreso_por_modulo[modulo.id]['completada'] = 0
                else:
                    completados += 1
            else:
                # Si no está completado, completados no se incrementa
                pass
        else:
            # Si no hay registro de progreso, se considera 0%
            progreso_por_modulo[modulo.id] = {'progreso': 0, 'completada': 0}

    promedio_capacitacion = round(progreso_total / total_modulos, 2)
    
    # ✅ FIX #2: Coherence validation
    # La capacitación se completa SOLO si:
    # 1. TODOS los módulos están completados (completados == total_modulos)
    # 2. Y TODOS tienen progreso >= 100 (implícito en #1)
    capacitacion_completada = completados == total_modulos and total_modulos > 0
    capacitacion_completada_int = 1 if capacitacion_completada else 0

    obj, created = progresoCapacitaciones.objects.get_or_create(
        colaborador_id=colaborador_id,
        capacitacion=capacitacion,
        defaults={
            'progreso': promedio_capacitacion,
            'completada': capacitacion_completada_int,
            'fecha_completada': timezone.now() if capacitacion_completada else None
        }
    )
    
    # Si ya existe, actualizar con validación
    update_fields = ['progreso', 'completada']
    if not created:
        # Detectar cambios para auditoría
        cambio_completada = obj.completada != capacitacion_completada_int
        cambio_progreso = float(obj.progreso or 0) != promedio_capacitacion
        
        if cambio_completada or cambio_progreso:
            logger.warning(
                f"📊 Capacitación {capacitacion.id} actualizada para colaborador {colaborador_id}: "
                f"completada={obj.completada}→{capacitacion_completada_int}, "
                f"progreso={float(obj.progreso or 0)}→{promedio_capacitacion}% "
                f"(módulos completados: {completados}/{total_modulos})"
            )
        
        obj.progreso = promedio_capacitacion
        obj.completada = capacitacion_completada_int
        
        # Si se completa y nunca se había completado antes, poner fecha
        if capacitacion_completada and not obj.fecha_completada:
            obj.fecha_completada = timezone.now()
            update_fields.append('fecha_completada')
        # Si se descompleta, limpiar la fecha
        elif not capacitacion_completada and obj.fecha_completada:
            obj.fecha_completada = None
            update_fields.append('fecha_completada')
        
        obj.save(update_fields=update_fields)

    return promedio_capacitacion


def comprimir_pdf(file):
    """
    Comprime un archivo PDF para reducir su tamaño
    Retorna un nuevo archivo comprimido o el original si falla
    """
    if not PIKEPDF_AVAILABLE:
        print("⚠️ Saltando compresión: pikepdf no disponible")
        return file
        
    try:
        # Crear archivo temporal para el PDF comprimido
        original_size = file.size
        file.seek(0)  # Asegurar que estamos al inicio del archivo
        
        # Crear un archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_input:
            # Escribir el contenido original
            for chunk in file.chunks():
                temp_input.write(chunk)
            temp_input.flush()
            temp_input_path = temp_input.name
        
        # Archivo de salida temporal
        temp_output_path = tempfile.mktemp(suffix='_compressed.pdf')
        
        # Comprimir usando pikepdf (sin decodificar streams para mantener compatibilidad)
        with pikepdf.open(temp_input_path) as pdf:
            pdf.save(
                temp_output_path,
                compress_streams=True,
                # NO decodificar streams - mantener formato original
                recompress_flate=False,  # No recomprimir
                min_version=(1, 5)
            )
        
        # Leer el archivo comprimido
        with open(temp_output_path, 'rb') as compressed_file:
            compressed_content = compressed_file.read()
        
        compressed_size = len(compressed_content)
        reduction_percent = ((original_size - compressed_size) / original_size) * 100
        
        # Limpiar archivos temporales
        os.unlink(temp_input_path)
        os.unlink(temp_output_path)
        
        # Si la compresión redujo el tamaño, usar el comprimido
        if compressed_size < original_size:
            compressed_file_obj = InMemoryUploadedFile(
                io.BytesIO(compressed_content),
                None,
                file.name,
                'application/pdf',
                compressed_size,
                None
            )
            print(f"PDF comprimido: {original_size / (1024*1024):.2f}MB → {compressed_size / (1024*1024):.2f}MB ({reduction_percent:.1f}% reducción)")
            return compressed_file_obj, compressed_size
        else:
            print(f"PDF no se pudo comprimir más, usando original")
            file.seek(0)
            return file, original_size
            
    except Exception as e:
        print(f"Error al comprimir PDF: {e}. Usando archivo original.")
        file.seek(0)
        return file, file.size


def guardar_archivo(file, carpeta, request, extensiones_permitidas=None, max_size_mb=10):
    """Guarda un archivo en Cloudinary y devuelve su URL pública HTTPS
    
    Límite gratuito de Cloudinary: 10 MB por archivo
    Comprime automáticamente los PDFs grandes
    """
    if not file:
        return None, "No se envió ningún archivo"

    ext = os.path.splitext(file.name)[1].lower()
    if extensiones_permitidas and ext not in extensiones_permitidas:
        return None, f"Extensión no permitida. Solo se permiten: {', '.join(extensiones_permitidas)}"

    # Si es PDF y es mayor a 5MB, intentar comprimir
    if ext == '.pdf' and file.size > 5 * 1024 * 1024:
        print(f"PDF grande detectado ({file.size / (1024*1024):.2f}MB), intentando comprimir...")
        file, new_size = comprimir_pdf(file)
    
    # Validar tamaño después de compresión
    size_mb = file.size / (1024 * 1024)
    if file.size > max_size_mb * 1024 * 1024:
        return None, f"El archivo supera el tamaño máximo permitido de {max_size_mb}MB. Tamaño actual: {size_mb:.2f}MB. Por favor, comprime el archivo antes de subirlo."

    try:
        # Configurar Cloudinary si no está configurado
        if not cloudinary.config().cloud_name:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
                api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
                api_secret=settings.CLOUDINARY_STORAGE['API_SECRET']
            )
        
        # Determinar tipo de recurso (image para imágenes, raw para PDFs y otros)
        resource_type = 'image' if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp'] else 'raw'
        
        # Subir a Cloudinary con configuración de tamaño
        upload_result = cloudinary.uploader.upload(
            file,
            folder=carpeta,
            resource_type=resource_type,
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            chunk_size=6000000  # Subir en chunks de 6MB para archivos grandes
        )
        
        # Retornar URL segura (HTTPS)
        file_url = upload_result['secure_url']
        return file_url, None
        
    except Exception as e:
        return None, f"Error al subir archivo a Cloudinary: {str(e)}"
    
    return file_url, None


# ==================== MANEJO SEGURO DE ARCHIVOS PARA CAPACITACIONES ====================

import hashlib
import uuid
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible

ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
ALLOWED_PDF_EXTENSION = {'pdf'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'ogg', 'mkv'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


def calcular_hash_archivo(file_obj) -> str:
    """Calcula el hash SHA256 de un archivo para detectar duplicados"""
    hash_obj = hashlib.sha256()
    for chunk in file_obj.chunks():
        hash_obj.update(chunk)
    file_obj.seek(0)  # Reset file pointer
    return hash_obj.hexdigest()


def validar_archivo(file_obj, allowed_extensions: set, max_size: int = MAX_FILE_SIZE) -> Tuple[bool, str]:
    """
    Valida un archivo según extensión y tamaño
    
    Args:
        file_obj: File object from request.FILES
        allowed_extensions: Set of allowed extensions (sin punto)
        max_size: Tamaño máximo en bytes
    
    Returns:
        (is_valid, error_message)
    """
    if not file_obj:
        return False, "No se proporcionó archivo"
    
    if file_obj.size > max_size:
        size_mb = max_size / (1024 * 1024)
        return False, f"Archivo demasiado grande. Máximo {size_mb}MB"
    
    filename = file_obj.name.lower()
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
    
    if ext not in allowed_extensions:
        return False, f"Tipo de archivo no permitido. Extensiones válidas: {', '.join(sorted(allowed_extensions))}"
    
    return True, ""


def procesar_archivo_multimedia(file_obj, tipo_archivo: str, nombre_unico: str = None) -> Tuple[str, str]:
    """
    Procesa y sube un archivo multimedia de forma segura
    
    Args:
        file_obj: File object
        tipo_archivo: 'imagen', 'pdf', 'video'
        nombre_unico: Nombre único para el archivo (si no se proporciona, se genera)
    
    Returns:
        (url, error_message)
    """
    # Validar tipo
    extensiones_permitidas = {
        'imagen': ALLOWED_IMAGE_EXTENSIONS,
        'pdf': ALLOWED_PDF_EXTENSION,
        'video': ALLOWED_VIDEO_EXTENSIONS,
    }
    
    if tipo_archivo not in extensiones_permitidas:
        return "", f"Tipo de archivo desconocido: {tipo_archivo}"
    
    # Validar archivo
    is_valid, error = validar_archivo(file_obj, extensiones_permitidas[tipo_archivo])
    if not is_valid:
        return "", error
    
    try:
        # Generar nombre único si no se proporciona
        if not nombre_unico:
            ext = file_obj.name.rsplit('.', 1)[-1].lower()
            nombre_unico = f"{uuid.uuid4().hex}.{ext}"
        
        # Crear carpeta destino
        carpeta = {
            'imagen': 'capacitaciones/imagenes',
            'pdf': 'capacitaciones/pdfs',
            'video': 'capacitaciones/videos',
        }[tipo_archivo]
        
        # Configurar Cloudinary si está disponible
        if hasattr(settings, 'CLOUDINARY_STORAGE') and settings.CLOUDINARY_STORAGE:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
                api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
                api_secret=settings.CLOUDINARY_STORAGE['API_SECRET']
            )
            
            resource_type = 'image' if tipo_archivo == 'imagen' else 'raw'
            upload_result = cloudinary.uploader.upload(
                file_obj,
                folder=carpeta,
                resource_type=resource_type,
                public_id=nombre_unico.rsplit('.', 1)[0],  # Sin extensión
                overwrite=True,  # Reemplazar si existe (evita duplicados)
                chunk_size=6000000
            )
            
            url = upload_result['secure_url']
        else:
            # Fallback a almacenamiento local
            carpeta_local = os.path.join(settings.MEDIA_ROOT, carpeta)
            os.makedirs(carpeta_local, exist_ok=True)
            ruta = os.path.join(carpeta_local, nombre_unico)
            
            with open(ruta, 'wb+') as f:
                for chunk in file_obj.chunks():
                    f.write(chunk)
            
            url = f"{settings.MEDIA_URL}{carpeta}/{nombre_unico}"
        
        return url, ""
        
    except Exception as e:
        return "", f"Error al procesar archivo: {str(e)}"


def limpiar_archivo(url: str) -> bool:
    """
    Elimina un archivo cargado (útil para rollback en caso de error)
    
    Args:
        url: URL del archivo a eliminar
    
    Returns:
        True si se eliminó, False si hubo error
    """
    try:
        if not url:
            return False
        
        # Si es URL de Cloudinary
        if 'cloudinary' in url or 'res.cloudinary' in url:
            try:
                # Extraer public_id de la URL
                # Formato: https://res.cloudinary.com/cloud_name/image/upload/v123/path/to/file
                parts = url.split('/upload/')
                if len(parts) > 1:
                    public_id = parts[1].split('?')[0].rsplit('.', 1)[0]
                    
                    if hasattr(settings, 'CLOUDINARY_STORAGE') and settings.CLOUDINARY_STORAGE:
                        cloudinary.config(
                            cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
                            api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
                            api_secret=settings.CLOUDINARY_STORAGE['API_SECRET']
                        )
                        
                        # Determinar tipo de recurso
                        resource_type = 'image' if any(ext in url for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']) else 'raw'
                        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
                        return True
            except Exception as e:
                logger.warning(f"No se pudo eliminar archivo de Cloudinary: {str(e)}")
                return False
        
        # Si es archivo local
        elif url.startswith(settings.MEDIA_URL):
            local_path = url.replace(settings.MEDIA_URL, '', 1)
            full_path = os.path.join(settings.MEDIA_ROOT, local_path)
            
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error al limpiar archivo {url}: {str(e)}")
        return False
