from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from capacitaciones.models import Capacitaciones, Modulos, Lecciones, progresoCapacitaciones
from usuarios.models import Colaboradores


class Command(BaseCommand):
    help = 'Crea una capacitacion de prueba, agrega colaborador inicial y luego agrega otro colaborador'

    def add_arguments(self, parser):
        parser.add_argument('--col1', type=int, required=True, help='ID del primer colaborador (agregar primero)')
        parser.add_argument('--col2', type=int, required=True, help='ID del segundo colaborador (agregar luego)')

    def handle(self, *args, **options):
        col1 = options['col1']
        col2 = options['col2']

        self.stdout.write(f'Creando capacitación de prueba...')
        ahora = timezone.now()
        cap = Capacitaciones.objects.create(
            titulo='Capacitacion Prueba Automatica',
            descripcion='Creada por comando de prueba',
            imagen='',
            estado=0,
            fecha_creacion=ahora,
            fecha_inicio=ahora,
            fecha_fin=ahora + timedelta(days=7),
            tipo='online'
        )

        mod = Modulos.objects.create(idcapacitacion=cap, nombremodulo='Modulo Prueba')

        # Crear lecciones de distintos tipos: pdf, video, formulario
        Lecciones.objects.create(idmodulo=mod, tituloleccion='Leccion PDF', tipoleccion='pdf', url='')
        Lecciones.objects.create(idmodulo=mod, tituloleccion='Leccion Video', tipoleccion='video', url='')
        Lecciones.objects.create(idmodulo=mod, tituloleccion='Leccion Formulario', tipoleccion='formulario', url='')

        self.stdout.write(f'Capacitacion creada: id={cap.id}')

        # Agregar primer colaborador
        try:
            c1 = Colaboradores.objects.get(idcolaborador=col1)
        except Colaboradores.DoesNotExist:
            self.stderr.write(f'Colaborador {col1} no existe. Abortando.')
            return

        progresoCapacitaciones.objects.create(
            capacitacion=cap,
            colaborador=c1,
            fecha_registro=timezone.now(),
            completada=0,
            progreso=0
        )
        self.stdout.write(f'Colaborador {col1} agregado a la capacitacion {cap.id}')

        # Ahora simular edición que agrega col2
        try:
            c2 = Colaboradores.objects.get(idcolaborador=col2)
        except Colaboradores.DoesNotExist:
            self.stderr.write(f'Colaborador {col2} no existe. Abortando después del primer agregado.')
            return

        # Agregar segundo colaborador
        progresoCapacitaciones.objects.create(
            capacitacion=cap,
            colaborador=c2,
            fecha_registro=timezone.now(),
            completada=0,
            progreso=0
        )