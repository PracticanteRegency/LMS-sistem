from django.core.files.storage import default_storage
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
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
MÓDULO DE BATCHING PARA ENVÍO DE CORREOS
==========================================

Proporciona funciones para enviar correos masivos a más de 500 colaboradores
dividiendo en lotes de máximo 500 correos por email.

Uso:
    from capacitaciones.batch_email import enviar_correo_batch
    
    enviar_correo_batch(
        correos=['email1@test.com', 'email2@test.com', ...],  # 1500+
        subject='Asunto',
        text_message='Texto plano',
        html_message='<html>...</html>',
        delay_entre_lotes=2  # segundos
    )
"""

import time
import logging
from typing import List, Tuple
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

# Constantes
BATCH_SIZE = 500  # Máximo de correos por email (límite SMTP estándar)
DEFAULT_DELAY = 2  # Segundos de pausa entre lotes


def dividir_en_lotes(correos: List[str], tamanio_lote: int = BATCH_SIZE) -> List[List[str]]:
    """
    Divide una lista de correos en lotes de tamaño máximo.
    
    Args:
        correos: Lista de direcciones de email
        tamanio_lote: Máximo de correos por lote (default: 500)
    
    Returns:
        Lista de lotes: [[email1, email2, ...], [email500+1, ...], ...]
    
    Ejemplo:
        correos = ['a@t.com', 'b@t.com', ..., 'zzz@t.com']  # 1500
        lotes = dividir_en_lotes(correos, 500)
        # Resultado: [[email1-500], [email501-1000], [email1001-1500]]
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
    delay_entre_lotes: int = DEFAULT_DELAY,
    from_email: str = None,
    fail_silently: bool = False
) -> Tuple[int, int, List[str]]:
    """
    Envía un correo masivo a múltiples colaboradores dividiéndolos en lotes.
    
    CARACTERÍSTICA PRINCIPAL: Soporta 1500+ colaboradores sin errores de servidor.
    IMPORTANTE: Filtra automáticamente usuarios desactivados (estadousuario = 0)
    
    Args:
        correos: Lista de direcciones de email (puede ser 1500+)
        subject: Asunto del email
        text_message: Cuerpo en texto plano
        html_message: Cuerpo en HTML
        delay_entre_lotes: Segundos de pausa entre envíos (default: 2)
        from_email: Email del remitente (default: settings.DEFAULT_FROM_EMAIL)
        fail_silently: Si True, silencia excepciones; si False, las levanta
    
    Returns:
        Tupla: (total_enviados, total_fallidos, lista_de_errores)
        
        Ejemplo:
            enviados, fallidos, errores = enviar_correo_batch(
                correos=['a@test.com', 'b@test.com', ...],  # 1500
                subject='Test Masivo',
                text_message='Hola',
                html_message='<html><body>Hola</body></html>'
            )
            print(f"Enviados: {enviados}, Fallidos: {fallidos}")
    
    Notas:
        - Divide automáticamente en lotes de 500 máximo
        - Agrega pausa entre lotes para evitar rate limiting
        - Registra cada intento en logs
        - Retorna estadísticas detalladas
        - Filtra colaboradores desactivados antes de enviar
    """
    if not correos:
        logger.warning("enviar_correo_batch: Lista de correos vacía")
        return 0, 0, []
    
    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL
    
    # Validar emails válidos Y que el colaborador esté activo
    correos_validos = []
    usuarios_desactivados = 0
    
    for email in correos:
        if not email or '@' not in email:
            continue
        
        # Verificar que el colaborador esté activo (estadocolaborador = 1)
        colaborador_activo = Colaboradores.objects.filter(
            correocolaborador=email,
            estadocolaborador=1
        ).exists()
        
        if not colaborador_activo:
            usuarios_desactivados += 1
            logger.debug(f"enviar_correo_batch: Email {email} omitido (colaborador desactivado o no encontrado)")
            continue
        
        correos_validos.append(email)
    
    if usuarios_desactivados > 0:
        logger.warning(f"enviar_correo_batch: {usuarios_desactivados} usuarios desactivados omitidos")
    
    # Dividir en lotes
    lotes = dividir_en_lotes(correos_validos, BATCH_SIZE)
    
    if not lotes:
        logger.error("enviar_correo_batch: No hay emails válidos después de validación")
        return 0, len(correos), ["No hay emails válidos o todos los usuarios están desactivados"]
    
    # Enviar por lotes
    total_enviados = 0
    total_fallidos = 0
    errores = []
    
    logger.info(f"enviar_correo_batch: Enviando a {len(correos_validos)} colaboradores activos en {len(lotes)} lotes")
    
    for num_lote, lote in enumerate(lotes, 1):
        try:
            logger.info(f"  Lote {num_lote}/{len(lotes)}: Enviando a {len(lote)} colaboradores...")
            
            # Crear email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=from_email,
                to=[],
                bcc=lote
            )
            
            # Adjuntar HTML
            email.attach_alternative(html_message, "text/html")
            
            # Enviar
            result = email.send(fail_silently=fail_silently)
            total_enviados += result
            
            logger.info(f"  Lote {num_lote}/{len(lotes)}: ✅ Enviado exitosamente")
            
            # Pausa entre lotes (excepto en el último)
            if num_lote < len(lotes):
                logger.debug(f"  Esperando {delay_entre_lotes}s antes del siguiente lote...")
                time.sleep(delay_entre_lotes)
        
        except Exception as e:
            total_fallidos += 1
            error_msg = f"Lote {num_lote}: {str(e)}"
            errores.append(error_msg)
            logger.error(f"  Lote {num_lote}/{len(lotes)}: ❌ Error - {error_msg}")
            
            if not fail_silently:
                raise
    
    # Estadísticas
    tasa_exito = (total_enviados / len(lotes) * 100) if lotes else 0
    logger.info(f"enviar_correo_batch: COMPLETADO - Enviados: {total_enviados}, Fallidos: {total_fallidos}, Tasa éxito: {tasa_exito:.1f}%")
    
    return total_enviados, total_fallidos, errores


def obtener_estadisticas_batching(num_colaboradores: int) -> dict:
    """
    Calcula estadísticas de batching para N colaboradores.
    
    Args:
        num_colaboradores: Número total de colaboradores
    
    Returns:
        Diccionario con estadísticas
        
    Ejemplo:
        stats = obtener_estadisticas_batching(1500)
        print(stats)
        # {
        #     'num_colaboradores': 1500,
        #     'tamanio_lote': 500,
        #     'num_lotes': 3,
        #     'tiempo_estimado_segundos': 15,
        #     'tiempo_estimado_minutos': 0.25
        # }
    """
    num_lotes = (num_colaboradores + BATCH_SIZE - 1) // BATCH_SIZE
    tiempo_por_lote = 3  # segundos (envío a SMTP)
    tiempo_pausa = DEFAULT_DELAY  # segundos (pausa entre lotes)
    
    tiempo_total = (num_lotes * tiempo_por_lote) + ((num_lotes - 1) * tiempo_pausa)
    
    return {
        'num_colaboradores': num_colaboradores,
        'tamanio_lote': BATCH_SIZE,
        'num_lotes': num_lotes,
        'tiempo_estimado_segundos': tiempo_total,
        'tiempo_estimado_minutos': round(tiempo_total / 60, 2),
        'tiempo_estimado_legible': f"{tiempo_total // 60}m {tiempo_total % 60}s"
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
    from capacitaciones.models import progresoCapacitaciones, Capacitaciones
    from usuarios.models import Colaboradores
    from django.utils import timezone
    
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
        
        # Enviar usando batch
        enviados, fallidos, errores = enviar_correo_batch(
            correos=correos,
            subject=subject,
            text_message=text_message,
            html_message=html_message,
            delay_entre_lotes=2,
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
    from capacitaciones.models import progresoCapacitaciones
    from usuarios.models import Colaboradores
    from django.utils import timezone
    
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
        
        # Enviar usando batch
        enviados, fallidos, errores = enviar_correo_batch(
            correos=correos,
            subject=subject,
            text_message=text_message,
            html_message=html_message,
            delay_entre_lotes=2,
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

    # Enviar usando batch
    enviados, fallidos, errores = enviar_correo_batch(
        correos=correos,
        subject=subject,
        text_message=text_message,
        html_message=html_message,
        delay_entre_lotes=2
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
    progreso_leccion, _ = progresolecciones.objects.update_or_create(
        idcolaborador_id=colaborador_id,
        idleccion=leccion,
        defaults={
            'progreso': progreso,
            'completada': completada
        }
    )

    progreso_modulo_data = actualizar_progreso_modulo(colaborador_id, leccion.idmodulo)
    return progreso_modulo_data


def actualizar_progreso_modulo(colaborador_id, modulo):
    """
    Calcula el promedio de progreso de todas las lecciones del módulo.
    """
    lecciones = Lecciones.objects.filter(idmodulo=modulo)
    total_lecciones = lecciones.count()
    if total_lecciones == 0:
        return {"progreso_modulo": 0, "progreso_capacitacion": 0}

    progreso_total = 0
    completadas = 0

    for leccion in lecciones:
        progreso_leccion = progresolecciones.objects.filter(
            idcolaborador_id=colaborador_id,
            idleccion=leccion
        ).first()

        if progreso_leccion:
            progreso_total += float(progreso_leccion.progreso)
            if progreso_leccion.completada:
                completadas += 1

    promedio_modulo = round(progreso_total / total_lecciones, 2)
    modulo_completado = completadas == total_lecciones

    progreso_modulo, _ = progresoModulo.objects.update_or_create(
        colaborador_id=colaborador_id,
        modulo=modulo,
        defaults={
            'progreso': promedio_modulo,
            'completada': modulo_completado
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
    """
    modulos = Modulos.objects.filter(idcapacitacion=capacitacion)
    total_modulos = modulos.count()
    if total_modulos == 0:
        return 0

    progreso_total = 0
    completados = 0

    for modulo in modulos:
        progreso_modulo = progresoModulo.objects.filter(
            colaborador_id=colaborador_id,
            modulo=modulo
        ).first()

        if progreso_modulo:
            progreso_total += float(progreso_modulo.progreso)
            if progreso_modulo.completada:
                completados += 1

    promedio_capacitacion = round(progreso_total / total_modulos, 2)
    capacitacion_completada = completados == total_modulos

    from django.utils import timezone
    obj, created = progresoCapacitaciones.objects.get_or_create(
        colaborador_id=colaborador_id,
        capacitacion=capacitacion,
        defaults={
            'progreso': promedio_capacitacion,
            'completada': capacitacion_completada,
            'fecha_completada': timezone.now() if capacitacion_completada else None
        }
    )
    # Si ya existe, solo actualizar progreso y completada
    update_fields = ['progreso', 'completada']
    if not created:
        obj.progreso = promedio_capacitacion
        obj.completada = capacitacion_completada
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
