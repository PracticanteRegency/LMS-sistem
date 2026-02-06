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
    """
    
    if not correos:
        logger.warning("enviar_correo_batch: Lista de correos vacía")
        return 0, 0, []
    
    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL
    
    # Validar emails válidos
    correos_validos = [email for email in correos if email and '@' in email]
    
    if len(correos_validos) < len(correos):
        invalidos = len(correos) - len(correos_validos)
        logger.warning(f"enviar_correo_batch: {invalidos} emails inválidos omitidos")
    
    # Dividir en lotes
    lotes = dividir_en_lotes(correos_validos, BATCH_SIZE)
    
    if not lotes:
        logger.error("enviar_correo_batch: No hay emails válidos después de validación")
        return 0, len(correos), ["No hay emails válidos"]
    
    # Enviar por lotes
    total_enviados = 0
    total_fallidos = 0
    errores = []
    
    logger.info(f"enviar_correo_batch: Enviando a {len(correos_validos)} colaboradores en {len(lotes)} lotes")
    
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
        # Obtener correos igual que en la función original
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
        
        # Preparar contenido
        subject = f"🚀 Capacitación Activada: {capacitacion.titulo}"
        
        text_message = (
            f"Estimado colaborador,\n\n"
            f"Reciba un cordial saludo.\n"
            f"Le informamos que la capacitación '{capacitacion.titulo}' está ahora disponible.\n\n"
            f"Fecha de inicio: {capacitacion.fecha_inicio.date()}\n"
            f"Fecha de finalización: {capacitacion.fecha_fin.date()}\n\n"
            f"Puede acceder en: https://formacion.cloudregencyapps.com/login\n\n"
            f"Atentamente,\n\n"
            f"Área de Formación Empresarial"
        )
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Capacitación Activada</h2>
            <p>Estimado colaborador,</p>
            <p>Le informamos que la capacitación <strong>{capacitacion.titulo}</strong> está ahora disponible.</p>
            <ul>
                <li><strong>Fecha de inicio:</strong> {capacitacion.fecha_inicio.date()}</li>
                <li><strong>Fecha de finalización:</strong> {capacitacion.fecha_fin.date()}</li>
            </ul>
            <p>
                <a href="https://formacion.cloudregencyapps.com/login" target="_blank">
                    <button style="background-color: #1F4788; color: white; padding: 10px 20px; text-decoration: none; border: none; border-radius: 5px; cursor: pointer;">
                        Acceder a la plataforma
                    </button>
                </a>
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
