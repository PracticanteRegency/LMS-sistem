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

    progresoCapacitaciones.objects.update_or_create(
        colaborador_id=colaborador_id,
        capacitacion=capacitacion,
        defaults={
            'progreso': promedio_capacitacion,
            'completada': capacitacion_completada
        }
    )

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



def enviar_correo_capacitacion_creada(capacitacion, colaboradores_ids=None):
    """
    Envía un correo masivo a los colaboradores.
    - Si `colaboradores_ids` es None: envía a todos los inscritos (comportamiento previo).
    - Si se pasa una lista de ids, envía sólo a esos colaboradores.
    """

    if colaboradores_ids is None:
        correos_qs = progresoCapacitaciones.objects.filter(capacitacion=capacitacion)
        correos = list(
            correos_qs.values_list("colaborador__correocolaborador", flat=True)
            .exclude(colaborador__correocolaborador__isnull=True)
            .exclude(colaborador__correocolaborador__exact="")
            .distinct()
        )
    else:
        correos = list(
            Colaboradores.objects.filter(idcolaborador__in=colaboradores_ids)
            .values_list('correocolaborador', flat=True)
            .exclude(correocolaborador__isnull=True)
            .exclude(correocolaborador__exact='')
            .distinct()
        )

    if not correos:
        return

    subject = f"🎓 Nueva Capacitación Activa: {capacitacion.titulo}"

    text_message = (
        f"Estimado colaborador@,\n\n"
        f"Reciba un cordial saludo.\n"
        f"Nos complace informarle que ha sido matriculado en la formación "
        f"'{capacitacion.titulo}'.\n\n"
        f"Fecha de inicio: {capacitacion.fecha_inicio.date()}\n"
        f"Fecha de finalización: {capacitacion.fecha_fin.date()}\n\n"
        f"Podrá acceder a la plataforma en el siguiente enlace: [enlace a la plataforma]\n\n"
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
            <a href="https://juvenescent-tamelessly-dennis.ngrok-free.dev" target="_blank">Acceder a la plataforma</a>
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

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[],
        bcc=correos,
    )

    email.attach_alternative(html_message, "text/html")
    email.send(fail_silently=False)

