"""
Comando de reparación única.

Detecta colaboradores con progresoCapacitaciones=100% pero sin registros
de progresoModulo (o con registros incompletos) y los crea al 100%.

Uso:
    python manage.py reparar_progreso_modulos
    python manage.py reparar_progreso_modulos --dry-run       # solo reporta, no escribe
    python manage.py reparar_progreso_modulos --capacitacion 5  # solo una capacitación
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from capacitaciones.models import (
    progresoCapacitaciones,
    progresoModulo,
    progresolecciones,
    Modulos,
    Lecciones,
)


class Command(BaseCommand):
    help = "Repara progresoModulo faltante para capacitaciones completadas al 100%"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra qué se crearía sin escribir nada en la BD",
        )
        parser.add_argument(
            "--capacitacion",
            type=int,
            default=None,
            help="Limitar la reparación a una capacitación específica (por id)",
        )
        parser.add_argument(
            "--fix-lecciones",
            action="store_true",
            help="También crea progresolecciones faltantes al 100% (además de módulos)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        cap_id = options["capacitacion"]
        fix_lecciones = options["fix_lecciones"]
        ahora = timezone.now()

        if dry_run:
            self.stdout.write(self.style.WARNING("--- MODO DRY-RUN: no se escribirá nada ---"))

        # 1. Registros completados al 100%
        qs = progresoCapacitaciones.objects.filter(progreso=100).select_related(
            "colaborador", "capacitacion"
        )
        if cap_id:
            qs = qs.filter(capacitacion_id=cap_id)

        total_registros = qs.count()
        self.stdout.write(f"Capacitaciones al 100% encontradas: {total_registros}")

        modulos_creados = 0
        lecciones_creadas = 0
        capacitaciones_afectadas = set()

        for pc in qs.iterator():
            colaborador = pc.colaborador
            capacitacion = pc.capacitacion

            modulos = list(
                Modulos.objects.filter(idcapacitacion=capacitacion).prefetch_related("lecciones_set")
            )

            for modulo in modulos:
                tiene_modulo = progresoModulo.objects.filter(
                    colaborador=colaborador, modulo=modulo
                ).exists()

                if not tiene_modulo:
                    capacitaciones_afectadas.add(capacitacion.id)
                    self.stdout.write(
                        f"  Falta progresoModulo | colaborador={colaborador.pk} "
                        f"capacitacion={capacitacion.pk} modulo={modulo.pk} ({modulo.nombremodulo})"
                    )
                    if not dry_run:
                        progresoModulo.objects.create(
                            colaborador=colaborador,
                            modulo=modulo,
                            progreso=100,
                            completada=1,
                            fecha_completado=ahora,
                        )
                    modulos_creados += 1

                if fix_lecciones:
                    lecciones = Lecciones.objects.filter(idmodulo=modulo)
                    for leccion in lecciones:
                        tiene_leccion = progresolecciones.objects.filter(
                            idcolaborador=colaborador, idleccion=leccion
                        ).exists()
                        if not tiene_leccion:
                            self.stdout.write(
                                f"    Falta progresoleccion | colaborador={colaborador.pk} "
                                f"leccion={leccion.pk} ({leccion.tituloleccion})"
                            )
                            if not dry_run:
                                progresolecciones.objects.create(
                                    idcolaborador=colaborador,
                                    idleccion=leccion,
                                    progreso=100,
                                    completada=1,
                                    fecha_completado=ahora,
                                )
                            lecciones_creadas += 1

        # Resumen final
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=== RESUMEN ==="))
        self.stdout.write(f"Capacitaciones afectadas: {len(capacitaciones_afectadas)}")
        self.stdout.write(
            f"progresoModulo {'que se crearían' if dry_run else 'creados'}: {modulos_creados}"
        )
        if fix_lecciones:
            self.stdout.write(
                f"progresolecciones {'que se crearían' if dry_run else 'creadas'}: {lecciones_creadas}"
            )
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run completado. Ejecuta sin --dry-run para aplicar los cambios."))
        else:
            self.stdout.write(self.style.SUCCESS("Reparación completada."))
