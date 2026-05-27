"""
Management command para recalcular todos los progresos de capacitaciones
basándose en el progreso real de las lecciones.

Detecta y corrige inconsistencias como:
- Capacitación marcada como completada pero sin lecciones completadas
- Progreso 100% pero lecciones sin completar
- Módulos marcados como completados sin todas las lecciones completadas

Uso:
    python manage.py recalculate_progress                  # Solo colaboradores activos, capacitaciones activas
    python manage.py recalculate_progress --all            # Todos los colaboradores y capacitaciones
    python manage.py recalculate_progress --dry-run        # Solo muestra qué corregiría, sin modificar nada
    python manage.py recalculate_progress --cap-id 5       # Solo una capacitación específica
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from capacitaciones.models import (
    Capacitaciones, Modulos, Lecciones,
    progresoCapacitaciones, progresoModulo, progresolecciones
)
from usuarios.models import Colaboradores


class Command(BaseCommand):
    help = (
        'Recalcula el progreso real de colaboradores en capacitaciones y corrige inconsistencias. '
        'Por defecto solo procesa colaboradores activos (estado=1) en capacitaciones activas (estado=1).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            dest='process_all',
            help='Procesar TODOS los colaboradores y capacitaciones, sin importar estado.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            dest='dry_run',
            help='Mostrar qué se corregiría sin hacer cambios en la base de datos.',
        )
        parser.add_argument(
            '--cap-id',
            type=int,
            dest='cap_id',
            help='Recalcular solo la capacitación con este ID.',
        )

    def handle(self, *args, **options):
        process_all = options['process_all']
        dry_run = options['dry_run']
        cap_id = options.get('cap_id')

        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 MODO DRY-RUN: No se modificará nada en la BD.\n'))

        stats = {
            'capacitaciones_procesadas': 0,
            'colaboradores_procesados': 0,
            'lecciones_corregidas': 0,
            'modulos_corregidos': 0,
            'capacitaciones_corregidas': 0,
            'errores': 0,
        }

        # Filtrar capacitaciones
        if cap_id:
            capacitaciones_qs = Capacitaciones.objects.filter(id=cap_id)
            if not capacitaciones_qs.exists():
                self.stderr.write(self.style.ERROR(f'❌ No se encontró capacitación con ID={cap_id}'))
                return
        elif process_all:
            capacitaciones_qs = Capacitaciones.objects.all()
        else:
            capacitaciones_qs = Capacitaciones.objects.filter(estado=1)

        stats['capacitaciones_procesadas'] = capacitaciones_qs.count()
        self.stdout.write(f'📋 Capacitaciones a procesar: {stats["capacitaciones_procesadas"]}')
        if not process_all and not cap_id:
            self.stdout.write('   (Solo activas, estado=1. Usa --all para todas)')

        for capacitacion in capacitaciones_qs:
            try:
                # Obtener módulos y lecciones de esta capacitación
                modulos = Modulos.objects.filter(idcapacitacion=capacitacion)
                lecciones_por_modulo = {}

                for modulo in modulos:
                    lecciones_por_modulo[modulo.id] = list(Lecciones.objects.filter(idmodulo=modulo))

                # Obtener progresos de colaboradores
                filtro_progreso = {'capacitacion': capacitacion}
                if not process_all:
                    filtro_progreso['colaborador__estadocolaborador'] = 1

                progresos_cap = progresoCapacitaciones.objects.filter(
                    **filtro_progreso
                ).select_related('colaborador')

                for prog_cap in progresos_cap:
                    colaborador = prog_cap.colaborador
                    stats['colaboradores_procesados'] += 1

                    total_modulos = modulos.count()
                    modulos_completados = 0
                    progreso_total_cap = 0
                    
                    # Verificar si existe algún registro de progreso en módulos para este colaborador en esta capacitación
                    hay_progreso_modulos = progresoModulo.objects.filter(
                        colaborador=colaborador,
                        modulo__idcapacitacion=capacitacion
                    ).exists()

                    for modulo in modulos:
                        lecciones = lecciones_por_modulo.get(modulo.id, [])
                        total_lecciones_mod = len(lecciones)

                        if total_lecciones_mod == 0:
                            modulos_completados += 1
                            progreso_total_cap += 100
                            continue

                        # Recalcular progreso del módulo basado en lecciones reales
                        lecciones_completadas_mod = 0
                        progreso_total_mod = 0

                        for leccion in lecciones:
                            prog_lec = progresolecciones.objects.filter(
                                idcolaborador=colaborador,
                                idleccion=leccion
                            ).first()

                            if prog_lec:
                                prog_valor = float(prog_lec.progreso or 0)
                                progreso_total_mod += prog_valor

                                if prog_lec.completada == 1 and prog_valor >= 100:
                                    lecciones_completadas_mod += 1
                                elif prog_lec.completada == 1 and prog_valor < 100:
                                    # Inconsistencia: completada=1 pero progreso < 100
                                    stats['lecciones_corregidas'] += 1
                                    self.stdout.write(self.style.WARNING(
                                        f'   📝 Lección "{leccion.tituloleccion}" (ID:{leccion.id}) - '
                                        f'Colab {colaborador.idcolaborador}: '
                                        f'completada=1 pero progreso={prog_valor}% → completada=0'
                                    ))
                                    if not dry_run:
                                        prog_lec.completada = 0
                                        prog_lec.fecha_completado = None
                                        prog_lec.save(update_fields=['completada', 'fecha_completado'])

                        # Calcular promedio real del módulo
                        promedio_modulo_real = round(progreso_total_mod / total_lecciones_mod, 2)
                        modulo_completado_real = lecciones_completadas_mod == total_lecciones_mod
                        modulo_completado_int = 1 if modulo_completado_real else 0

                        if modulo_completado_real:
                            modulos_completados += 1

                        progreso_total_cap += promedio_modulo_real

                        # Verificar si el módulo necesita corrección
                        prog_mod_actual = progresoModulo.objects.filter(
                            colaborador=colaborador, modulo=modulo
                        ).first()

                        necesita_correccion_mod = (
                            prog_mod_actual and
                            (prog_mod_actual.completada != modulo_completado_int or
                             float(prog_mod_actual.progreso or 0) != promedio_modulo_real)
                        )

                        if necesita_correccion_mod:
                            stats['modulos_corregidos'] += 1
                            self.stdout.write(self.style.WARNING(
                                f'   📦 Módulo "{modulo.nombremodulo}" (ID:{modulo.id}) - '
                                f'Colab {colaborador.idcolaborador}: '
                                f'completada={prog_mod_actual.completada}→{modulo_completado_int}, '
                                f'progreso={float(prog_mod_actual.progreso or 0)}→{promedio_modulo_real}'
                            ))

                        if not dry_run:
                            progresoModulo.objects.update_or_create(
                                colaborador=colaborador,
                                modulo=modulo,
                                defaults={
                                    'progreso': promedio_modulo_real,
                                    'completada': modulo_completado_int,
                                    'fecha_completado': timezone.now() if modulo_completado_real else None
                                }
                            )

                    # Calcular promedio real de la capacitación
                    if total_modulos > 0:
                        promedio_cap_real = round(progreso_total_cap / total_modulos, 2)
                    else:
                        promedio_cap_real = 0

                    cap_completada_real = modulos_completados == total_modulos and total_modulos > 0
                    cap_completada_int = 1 if cap_completada_real else 0
                    
                    # Lógica de decisión:
                    # 1. Si YA está completada → MANTENERLA completada (no modificar)
                    # 2. Si NO está completada:
                    #    - Si NO hay progreso → dejarla incompleta
                    #    - Si SÍ hay progreso → actualizar según el progreso real
                    if prog_cap.completada == 1:
                        # Ya está completada, mantenerla así
                        cap_completada_int = 1
                        promedio_cap_real = 100
                    else:
                        # NO está completada, entonces SÍ la podemos modificar
                        # Usar el cálculo real basado en progreso de módulos y lecciones
                        cap_completada_int = 1 if cap_completada_real else 0
                        # El promedio ya está calculado arriba

                    # Detectar inconsistencia en capacitación
                    progreso_anterior = float(prog_cap.progreso or 0)
                    completada_anterior = prog_cap.completada

                    if completada_anterior != cap_completada_int or progreso_anterior != promedio_cap_real:
                        # Contar como corregida solo si se actualizo desde incompleta
                        if completada_anterior == 0 and cap_completada_int == 1:
                            stats['capacitaciones_corregidas'] += 1

                        self.stdout.write(self.style.WARNING(
                            f'   🎓 Cap "{capacitacion.titulo}" (ID:{capacitacion.id}) - '
                            f'Colab {colaborador.idcolaborador} '
                            f'({colaborador.nombrecolaborador} {colaborador.apellidocolaborador}): '
                            f'completada={completada_anterior}→{cap_completada_int}, '
                            f'progreso={progreso_anterior}→{promedio_cap_real}'
                        ))

                    if not dry_run:
                        prog_cap.progreso = promedio_cap_real
                        prog_cap.completada = cap_completada_int

                        update_fields = ['progreso', 'completada']

                        # Si está completada (sea por lógica real o por legacy), registrar fecha
                        if cap_completada_int == 1 and not prog_cap.fecha_completada:
                            prog_cap.fecha_completada = timezone.now()
                            update_fields.append('fecha_completada')
                        # Si se descompleta, limpiar la fecha
                        elif cap_completada_int == 0 and prog_cap.fecha_completada:
                            prog_cap.fecha_completada = None
                            update_fields.append('fecha_completada')

                        prog_cap.save(update_fields=update_fields)

            except Exception as e:
                stats['errores'] += 1
                self.stderr.write(self.style.ERROR(
                    f'❌ Error procesando capacitación {capacitacion.id} ({capacitacion.titulo}): {e}'
                ))

        # Resumen final
        self.stdout.write('')
        action = 'encontradas (sin modificar)' if dry_run else 'aplicadas'
        self.stdout.write(self.style.SUCCESS(
            f'✅ Recálculo completado — correcciones {action}:\n'
            f'   📋 Capacitaciones procesadas: {stats["capacitaciones_procesadas"]}\n'
            f'   👥 Colaboradores procesados: {stats["colaboradores_procesados"]}\n'
            f'   📝 Lecciones corregidas: {stats["lecciones_corregidas"]}\n'
            f'   📦 Módulos corregidos: {stats["modulos_corregidos"]}\n'
            f'   🎓 Capacitaciones corregidas: {stats["capacitaciones_corregidas"]}\n'
            f'   ❌ Errores: {stats["errores"]}'
        ))
