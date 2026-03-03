from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import os
import logging
from django.conf import settings
from .models import CertificadoGenerado

logger = logging.getLogger("certificado_debug")


@shared_task(bind=True)
def limpiar_certificados_antiguos(self):
    """
    Tarea Celery que elimina certificados generados hace más de 24 horas
    Se ejecuta automáticamente cada hora según la configuración de celerybeat
    """
    logger.warning("🧹 Iniciando limpieza de certificados antiguos...")
    
    # Calcular fecha límite (hace 24 horas)
    fecha_limite = timezone.now() - timedelta(hours=24)
    
    # Buscar certificados más antiguos que 24 horas
    certificados_antiguos = CertificadoGenerado.objects.filter(
        fecha_generacion__lt=fecha_limite
    )
    
    eliminados = 0
    errores = 0
    
    for cert in certificados_antiguos:
        try:
            # Eliminar archivo físico
            if cert.archivo_pdf:
                archivo_path = os.path.join(settings.MEDIA_ROOT, str(cert.archivo_pdf))
                if os.path.exists(archivo_path):
                    os.remove(archivo_path)
                    logger.warning(f"✓ Archivo eliminado: {archivo_path}")
                    eliminados += 1
            
            # Eliminar registro de la BD
            cert.delete()
            
        except Exception as e:
            logger.error(f"❌ Error eliminando certificado {cert.id}: {e}")
            errores += 1
    
    logger.warning(f"✅ Limpieza completada: {eliminados} archivos eliminados, {errores} errores")
    
    return {
        'eliminados': eliminados,
        'errores': errores,
        'mensaje': f'Se eliminaron {eliminados} certificados antiguos'
    }


@shared_task(bind=True)
def limpiar_directorio_certificados(self):
    """
    Tarea Celery que limpia archivos huérfanos en el directorio de certificados
    (archivos que no tienen registro en la BD)
    """
    logger.warning("🧹 Iniciando limpieza de directorio de certificados...")
    
    cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificados_generados')
    
    if not os.path.exists(cert_dir):
        logger.warning("⚠️ Directorio de certificados no existe")
        return {'eliminados': 0, 'errores': 0}
    
    # Obtener todos los certificados en BD
    certificados_bd = set()
    for cert in CertificadoGenerado.objects.all():
        if cert.archivo_pdf:
            full_path = os.path.join(settings.MEDIA_ROOT, str(cert.archivo_pdf))
            certificados_bd.add(full_path)
    
    # Recorrer directorio y eliminar huérfanos
    eliminados = 0
    errores = 0
    
    for root, dirs, files in os.walk(cert_dir):
        for file in files:
            file_path = os.path.join(root, file)
            
            # Si no está en BD y es más antiguo de 24 horas, eliminar
            if file_path not in certificados_bd:
                try:
                    # Verificar que sea más antiguo de 24 horas
                    fecha_creacion = timezone.datetime.fromtimestamp(os.path.getmtime(file_path), tz=timezone.utc)
                    if timezone.now() - fecha_creacion > timedelta(hours=24):
                        os.remove(file_path)
                        logger.warning(f"✓ Archivo huérfano eliminado: {file_path}")
                        eliminados += 1
                except Exception as e:
                    logger.error(f"❌ Error eliminando archivo huérfano {file_path}: {e}")
                    errores += 1
    
    logger.warning(f"✅ Limpieza de directorio completada: {eliminados} archivos eliminados, {errores} errores")
    
    return {
        'eliminados': eliminados,
        'errores': errores,
        'mensaje': f'Se eliminaron {eliminados} archivos huérfanos'
    }
