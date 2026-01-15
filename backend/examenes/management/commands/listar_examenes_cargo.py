from django.core.management.base import BaseCommand
from examenes.models import ExamenesCargo
from django.db.models import Count


class Command(BaseCommand):
    help = 'Lista todos los registros de ExamenesCargo con detalles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--empresa',
            type=int,
            help='Filtrar por ID de empresa'
        )
        parser.add_argument(
            '--cargo',
            type=int,
            help='Filtrar por ID de cargo'
        )
        parser.add_argument(
            '--tipo',
            type=str,
            choices=['INGRESO', 'PERIODICO', 'RETIRO'],
            help='Filtrar por tipo de examen'
        )
        parser.add_argument(
            '--stats',
            action='store_true',
            help='Mostrar estadísticas resumidas'
        )

    def handle(self, *args, **options):
        queryset = ExamenesCargo.objects.select_related(
            'empresa', 'cargo', 'examen'
        ).order_by('empresa__nombre_empresa', 'cargo__nombrecargo', 'tipo', 'examen__nombre')

        # Aplicar filtros
        if options['empresa']:
            queryset = queryset.filter(empresa_id=options['empresa'])
        
        if options['cargo']:
            queryset = queryset.filter(cargo_id=options['cargo'])
        
        if options['tipo']:
            queryset = queryset.filter(tipo=options['tipo'])

        total = queryset.count()
        
        if options['stats']:
            # Mostrar estadísticas
            self.stdout.write(self.style.SUCCESS('\n=== ESTADÍSTICAS EXAMENES POR CARGO ===\n'))
            
            stats_empresa = queryset.values('empresa__nombre_empresa').annotate(
                total=Count('id')
            ).order_by('-total')
            
            self.stdout.write('Por Empresa:')
            for stat in stats_empresa:
                self.stdout.write(f"  {stat['empresa__nombre_empresa']}: {stat['total']} registros")
            
            stats_tipo = queryset.values('tipo').annotate(
                total=Count('id')
            ).order_by('-total')
            
            self.stdout.write('\nPor Tipo:')
            for stat in stats_tipo:
                self.stdout.write(f"  {stat['tipo']}: {stat['total']} registros")
            
            stats_cargo = queryset.values('cargo__nombrecargo').annotate(
                total=Count('id')
            ).order_by('-total')[:10]
            
            self.stdout.write('\nTop 10 Cargos con más exámenes:')
            for stat in stats_cargo:
                self.stdout.write(f"  {stat['cargo__nombrecargo']}: {stat['total']} registros")
            
            self.stdout.write(f"\n{self.style.SUCCESS(f'TOTAL REGISTROS: {total}')}\n")
        else:
            # Mostrar listado detallado
            self.stdout.write(self.style.SUCCESS(f'\n=== LISTADO EXAMENES POR CARGO ({total} registros) ===\n'))
            
            current_empresa = None
            current_cargo = None
            
            for registro in queryset:
                # Agrupar por empresa
                if current_empresa != registro.empresa.nombre_empresa:
                    current_empresa = registro.empresa.nombre_empresa
                    self.stdout.write(self.style.WARNING(f'\n### EMPRESA: {current_empresa} (ID: {registro.empresa.idempresa})'))
                
                # Agrupar por cargo
                if current_cargo != registro.cargo.nombrecargo:
                    current_cargo = registro.cargo.nombrecargo
                    self.stdout.write(f'\n  ► CARGO: {current_cargo} (ID: {registro.cargo.idcargo})')
                
                # Mostrar examen
                tipo_color = {
                    'INGRESO': self.style.SUCCESS,
                    'PERIODICO': self.style.WARNING,
                    'RETIRO': self.style.ERROR
                }.get(registro.tipo, self.style.NOTICE)
                
                self.stdout.write(
                    f'    [{tipo_color(registro.tipo)}] {registro.examen.nombre} '
                    f'(Examen ID: {registro.examen.id_examen}, Fecha: {registro.fecha_creacion.strftime("%Y-%m-%d %H:%M")})'
                )
            
            self.stdout.write(self.style.SUCCESS(f'\n\nTOTAL: {total} registros\n'))
