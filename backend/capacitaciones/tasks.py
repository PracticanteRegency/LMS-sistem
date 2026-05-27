from celery import shared_task
from django.utils import timezone
from datetime import timedelta, datetime, timezone as dt_timezone
import os
import logging
from django.conf import settings
from .models import CertificadoGenerado, Capacitaciones, Lecciones, PreguntasLecciones, Respuestas

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
    Tarea Celery que limpia archivos huérfanos en la carpeta de capacitaciones y certificados.
    
    Limpia:
    1. Certificados huérfanos (no vinculados a BD)
    2. Imágenes de capacitaciones eliminadas
    3. PDFs de lecciones eliminadas
    4. Imágenes de preguntas eliminadas
    5. Imágenes de respuestas eliminadas
    
    Solo elimina archivos:
    - Más antiguos de 24 horas
    - En almacenamiento local (no Cloudinary)
    - Sin referencia en BD
    """
    logger.warning("🧹 Iniciando limpieza de archivos huérfanos de capacitaciones y certificados...")
    
    eliminados_total = 0
    errores_total = 0
    detalles = {
        'certificados': {'eliminados': 0, 'errores': 0},
        'capacitaciones': {'eliminados': 0, 'errores': 0},
        'lecciones': {'eliminados': 0, 'errores': 0},
        'preguntas': {'eliminados': 0, 'errores': 0},
        'respuestas': {'eliminados': 0, 'errores': 0},
    }
    
    # ==================== LIMPIAR CERTIFICADOS ====================
    cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificados_generados')
    if os.path.exists(cert_dir):
        logger.warning("📋 Limpiando certificados huérfanos...")
        
        # Obtener todos los certificados válidos en BD
        certificados_bd = set()
        for cert in CertificadoGenerado.objects.all():
            if cert.archivo_pdf:
                full_path = os.path.join(settings.MEDIA_ROOT, str(cert.archivo_pdf))
                certificados_bd.add(full_path)
        
        # Recorrer directorio y eliminar huérfanos
        for root, dirs, files in os.walk(cert_dir):
            for file in files:
                file_path = os.path.join(root, file)
                
                if file_path not in certificados_bd:
                    try:
                        fecha_creacion = datetime.fromtimestamp(
                            os.path.getmtime(file_path), tz=dt_timezone.utc
                        )
                        if timezone.now() - fecha_creacion > timedelta(hours=24):
                            os.remove(file_path)
                            logger.warning(f"✓ Certificado huérfano eliminado: {file_path}")
                            detalles['certificados']['eliminados'] += 1
                    except Exception as e:
                        logger.error(f"❌ Error eliminando certificado {file_path}: {e}")
                        detalles['certificados']['errores'] += 1
    
    # ==================== LIMPIAR CAPACITACIONES ====================
    cap_dir = os.path.join(settings.MEDIA_ROOT, 'capacitaciones')
    if os.path.exists(cap_dir):
        logger.warning("🎓 Limpiando archivos de capacitaciones...")
        
        # Obtener todos los archivos válidos en BD
        archivos_validos = set()
        
        # Imágenes de capacitaciones
        for cap in Capacitaciones.objects.all():
            if cap.imagen and not _es_url_cloudinary(cap.imagen):
                # Es una URL local
                archivo_local = _extraer_ruta_local(cap.imagen)
                if archivo_local:
                    full_path = os.path.join(settings.MEDIA_ROOT, archivo_local)
                    archivos_validos.add(full_path)
        
        # URLs de lecciones (PDFs, imágenes, videos)
        for leccion in Lecciones.objects.all():
            if leccion.url and not _es_url_cloudinary(leccion.url):
                archivo_local = _extraer_ruta_local(leccion.url)
                if archivo_local:
                    full_path = os.path.join(settings.MEDIA_ROOT, archivo_local)
                    archivos_validos.add(full_path)
        
        # Multimedia de preguntas
        for pregunta in PreguntasLecciones.objects.all():
            if pregunta.urlmultimedia and not _es_url_cloudinary(pregunta.urlmultimedia):
                archivo_local = _extraer_ruta_local(pregunta.urlmultimedia)
                if archivo_local:
                    full_path = os.path.join(settings.MEDIA_ROOT, archivo_local)
                    archivos_validos.add(full_path)
        
        # Imágenes de respuestas
        for respuesta in Respuestas.objects.all():
            if respuesta.urlimagen and not _es_url_cloudinary(respuesta.urlimagen):
                archivo_local = _extraer_ruta_local(respuesta.urlimagen)
                if archivo_local:
                    full_path = os.path.join(settings.MEDIA_ROOT, archivo_local)
                    archivos_validos.add(full_path)
        
        # Recorrer directorio y eliminar huérfanos
        for root, dirs, files in os.walk(cap_dir):
            for file in files:
                file_path = os.path.join(root, file)
                
                if file_path not in archivos_validos:
                    try:
                        fecha_creacion = datetime.fromtimestamp(
                            os.path.getmtime(file_path), tz=dt_timezone.utc
                        )
                        if timezone.now() - fecha_creacion > timedelta(hours=24):
                            os.remove(file_path)
                            
                            # Determinar tipo de archivo para estadísticas
                            archivo_tipo = _determinar_tipo_archivo(file_path)
                            logger.warning(f"✓ Archivo huérfano ({archivo_tipo}) eliminado: {file_path}")
                            
                            if archivo_tipo == 'imagen_capacitacion':
                                detalles['capacitaciones']['eliminados'] += 1
                            elif archivo_tipo == 'leccion':
                                detalles['lecciones']['eliminados'] += 1
                            elif archivo_tipo == 'pregunta':
                                detalles['preguntas']['eliminados'] += 1
                            elif archivo_tipo == 'respuesta':
                                detalles['respuestas']['eliminados'] += 1
                    except Exception as e:
                        logger.error(f"❌ Error eliminando archivo {file_path}: {e}")
                        
                        archivo_tipo = _determinar_tipo_archivo(file_path)
                        if archivo_tipo == 'imagen_capacitacion':
                            detalles['capacitaciones']['errores'] += 1
                        elif archivo_tipo == 'leccion':
                            detalles['lecciones']['errores'] += 1
                        elif archivo_tipo == 'pregunta':
                            detalles['preguntas']['errores'] += 1
                        elif archivo_tipo == 'respuesta':
                            detalles['respuestas']['errores'] += 1
    
    # ==================== RESUMEN ====================
    for tipo, stats in detalles.items():
        eliminados_total += stats['eliminados']
        errores_total += stats['errores']
    
    resumen = f"""
    ✅ Limpieza completada:
    📋 Certificados: {detalles['certificados']['eliminados']} eliminados, {detalles['certificados']['errores']} errores
    🎓 Capacitaciones: {detalles['capacitaciones']['eliminados']} eliminados, {detalles['capacitaciones']['errores']} errores
    📚 Lecciones: {detalles['lecciones']['eliminados']} eliminados, {detalles['lecciones']['errores']} errores
    ❓ Preguntas: {detalles['preguntas']['eliminados']} eliminados, {detalles['preguntas']['errores']} errores
    ✅ Respuestas: {detalles['respuestas']['eliminados']} eliminados, {detalles['respuestas']['errores']} errores
    
    Total: {eliminados_total} archivos eliminados, {errores_total} errores
    """
    logger.warning(resumen)
    
    return {
        'eliminados_total': eliminados_total,
        'errores_total': errores_total,
        'detalles': detalles,
        'mensaje': f'Se eliminaron {eliminados_total} archivos huérfanos en total'
    }


# ==================== FUNCIONES HELPER ====================

def _es_url_cloudinary(url: str) -> bool:
    """Verifica si una URL pertenece a Cloudinary"""
    if not url:
        return False
    return 'cloudinary' in url or 'res.cloudinary' in url


def _extraer_ruta_local(url: str) -> str:
    """
    Extrae la ruta local relativa de una URL de media.
    
    Ejemplo:
    - Input: "/media/capacitaciones/imagenes/abc123.png"
    - Output: "capacitaciones/imagenes/abc123.png"
    """
    if not url:
        return ""
    
    # Si comienza con /media/, remover ese prefijo
    if url.startswith(settings.MEDIA_URL):
        return url[len(settings.MEDIA_URL):]
    
    # Si es una URL completa, remover dominio
    if url.startswith('http'):
        # Buscar /media/ en la URL
        if '/media/' in url:
            return url.split('/media/')[1]
    
    return url


def _determinar_tipo_archivo(file_path: str) -> str:
    """
    Determina el tipo de archivo basado en su ruta.
    Útil para estadísticas de limpieza.
    """
    if 'certificados' in file_path:
        return 'certificado'
    elif 'imagenes' in file_path:
        return 'imagen_capacitacion'
    elif 'pdfs' in file_path:
        return 'leccion'
    elif 'videos' in file_path:
        return 'leccion'
    elif 'preguntas' in file_path:
        return 'pregunta'
    elif 'respuestas' in file_path:
        return 'respuesta'
    else:
        return 'desconocido'
