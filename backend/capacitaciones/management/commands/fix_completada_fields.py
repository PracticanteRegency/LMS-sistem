"""
Management command para corregir los campos 'completada' en las tablas de progreso.
Asegura que todos los valores de 'completada' sean 0 o 1 (enteros).
"""
from django.core.management.base import BaseCommand
from django.db import connection
from capacitaciones.models import progresolecciones, progresoModulo, progresoCapacitaciones


class Command(BaseCommand):
    help = 'Corrige los campos completada para asegurar consistencia (0 o 1)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando corrección de campos completada...'))

        # Corregir progresolecciones
        self.stdout.write('Corrigiendo progresolecciones...')
        lecciones_updated = progresolecciones.objects.exclude(
            completada__in=[0, 1, None]
        ).update(completada=0)
        
        # Convertir True/False si existen
        lecciones_true = progresolecciones.objects.filter(completada=True).update(completada=1)
        lecciones_false = progresolecciones.objects.filter(completada=False).update(completada=0)
        
        self.stdout.write(f'  - Registros corregidos: {lecciones_updated}')
        self.stdout.write(f'  - True convertidos a 1: {lecciones_true}')
        self.stdout.write(f'  - False convertidos a 0: {lecciones_false}')

        # Corregir progresoModulo
        self.stdout.write('Corrigiendo progresoModulo...')
        modulos_updated = progresoModulo.objects.exclude(
            completada__in=[0, 1, None]
        ).update(completada=0)
        
        modulos_true = progresoModulo.objects.filter(completada=True).update(completada=1)
        modulos_false = progresoModulo.objects.filter(completada=False).update(completada=0)
        
        self.stdout.write(f'  - Registros corregidos: {modulos_updated}')
        self.stdout.write(f'  - True convertidos a 1: {modulos_true}')
        self.stdout.write(f'  - False convertidos a 0: {modulos_false}')

        # Corregir progresoCapacitaciones
        self.stdout.write('Corrigiendo progresoCapacitaciones...')
        capacitaciones_updated = progresoCapacitaciones.objects.exclude(
            completada__in=[0, 1, None]
        ).update(completada=0)
        
        capacitaciones_true = progresoCapacitaciones.objects.filter(completada=True).update(completada=1)
        capacitaciones_false = progresoCapacitaciones.objects.filter(completada=False).update(completada=0)
        
        self.stdout.write(f'  - Registros corregidos: {capacitaciones_updated}')
        self.stdout.write(f'  - True convertidos a 1: {capacitaciones_true}')
        self.stdout.write(f'  - False convertidos a 0: {capacitaciones_false}')

        self.stdout.write(self.style.SUCCESS('✓ Corrección completada exitosamente'))
