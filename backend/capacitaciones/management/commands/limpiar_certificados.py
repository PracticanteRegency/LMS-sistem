"""
Management command para limpiar certificados antiguos manualmente.

Uso:
    python manage.py limpiar_certificados
    python manage.py limpiar_certificados --dias 30  # Para certificados > 30 días
    python manage.py limpiar_certificados --orphaned-only  # Solo archivos huérfanos
"""

import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from capacitaciones.models import CertificadoGenerado
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Limpia certificados antiguos de la base de datos y del disco'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dias',
            type=int,
            default=1,
            help='Elimina certificados más antiguos que N días (default: 1)'
        )
        parser.add_argument(
            '--orphaned-only',
            action='store_true',
            help='Solo limpia archivos huérfanos (no referenciados en BD)'
        )

    def handle(self, *args, **options):
        dias = options['dias']
        orphaned_only = options.get('orphaned_only', False)

        if orphaned_only:
            self.limpiar_archivos_huerfanos()
        else:
            self.limpiar_certificados_antiguos(dias)

    def limpiar_certificados_antiguos(self, dias):
        """Elimina certificados y archivos de la BD más antiguos que N días"""
        self.stdout.write(f'🧹 Limpiando certificados más antiguos de {dias} día(s)...')
        
        fecha_limite = timezone.now() - timedelta(days=dias)
        certificados = CertificadoGenerado.objects.filter(
            fecha_generacion__lt=fecha_limite
        )
        
        count_eliminados = 0
        count_errores = 0
        
        for cert in certificados:
            try:
                # Eliminar archivo del disco
                if cert.archivo_pdf:
                    archivo_path = os.path.join(settings.MEDIA_ROOT, str(cert.archivo_pdf))
                    if os.path.exists(archivo_path):
                        os.remove(archivo_path)
                        self.stdout.write(f'  ✓ Archivo eliminado: {cert.archivo_pdf}')
                    else:
                        self.stdout.write(f'  ⚠️  Archivo no encontrado: {archivo_path}')
                
                # Eliminar registro de BD
                cert.delete()
                count_eliminados += 1
                self.stdout.write(
                    f'  ✓ Registro BD eliminado: colaborador {cert.colaborador_id}, '
                    f'capacitación {cert.capacitacion_id}'
                )
            except Exception as e:
                count_errores += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'  ❌ Error al eliminar certificado {cert.id}: {e}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Limpieza completada: {count_eliminados} eliminados, {count_errores} errores'
            )
        )

    def limpiar_archivos_huerfanos(self):
        """Elimina archivos en disco que no están referenciados en la BD"""
        self.stdout.write('🧹 Limpiando archivos huérfanos...')
        
        directorio = os.path.join(settings.MEDIA_ROOT, 'certificados_generados')
        if not os.path.exists(directorio):
            self.stdout.write(self.style.WARNING(f'Directorio no encontrado: {directorio}'))
            return
        
        # Obtener todos los archivos referenciados en BD
        archivos_bd = set()
        for cert in CertificadoGenerado.objects.all():
            if cert.archivo_pdf:
                archivos_bd.add(str(cert.archivo_pdf))
        
        # Buscar archivos en disco
        count_eliminados = 0
        count_errores = 0
        
        for root, dirs, files in os.walk(directorio):
            for filename in files:
                archivo_path = os.path.join(root, filename)
                archivo_rel = os.path.relpath(archivo_path, settings.MEDIA_ROOT)
                
                # Normalizar separadores para comparación
                archivo_rel = archivo_rel.replace('\\', '/')
                
                if archivo_rel not in archivos_bd:
                    # Verificar que sea más antiguo de 24 horas
                    tiempo_creacion = os.path.getctime(archivo_path)
                    tiempo_actual = timezone.now().timestamp()
                    edad_horas = (tiempo_actual - tiempo_creacion) / 3600
                    
                    if edad_horas > 24:
                        try:
                            os.remove(archivo_path)
                            count_eliminados += 1
                            self.stdout.write(f'  ✓ Archivo huérfano eliminado: {archivo_rel}')
                        except Exception as e:
                            count_errores += 1
                            self.stdout.write(
                                self.style.ERROR(f'  ❌ Error al eliminar: {e}')
                            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Limpieza completada: {count_eliminados} eliminados, {count_errores} errores'
            )
        )
