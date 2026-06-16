"""
Management command para recalcular todos los puntos del ranking desde cero.

Uso:
  python manage.py recalcular_puntos_ranking
  python manage.py recalcular_puntos_ranking --edicion <id>
  python manage.py recalcular_puntos_ranking --dry-run
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


class Command(BaseCommand):
    help = "Recalcula los puntos del ranking desde cero a partir de todos los partidos finalizados."

    def add_arguments(self, parser):
        parser.add_argument(
            "--edicion",
            type=int,
            default=None,
            help="ID de la EdicionMundial a recalcular. Si no se indica, usa la edición activa.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra qué se haría sin guardar ningún cambio.",
        )

    def handle(self, *args, **options):
        from mundial.models import (
            EdicionMundial,
            Partido,
            EstadoPartido,
            RankingMundial,
            ConfiguracionTorneo,
        )
        from mundial.utils import recalcular_posiciones_ranking

        dry_run = options["dry_run"]
        edicion_id = options["edicion"]

        # 1. Obtener edición
        if edicion_id:
            try:
                edicion = EdicionMundial.objects.get(pk=edicion_id)
            except EdicionMundial.DoesNotExist:
                raise CommandError(f"No existe EdicionMundial con id={edicion_id}")
        else:
            edicion = EdicionMundial.objects.filter(activa=True).first()
            if not edicion:
                raise CommandError("No hay ninguna EdicionMundial activa. Usa --edicion <id>.")

        self.stdout.write(f"\nEdición: {edicion} (id={edicion.pk})")
        if dry_run:
            self.stdout.write(self.style.WARNING("Modo DRY-RUN — no se guardarán cambios.\n"))

        # 2. Partidos finalizados
        partidos = (
            Partido.objects
            .filter(edicion=edicion, estado=EstadoPartido.FINALIZADO)
            .prefetch_related("predicciones__colaborador")
            .order_by("fecha", "hora")
        )
        total_partidos = partidos.count()
        if total_partidos == 0:
            self.stdout.write(self.style.WARNING("No hay partidos finalizados en esta edición."))
            return

        self.stdout.write(f"Partidos finalizados a procesar: {total_partidos}")

        # 3. Configuración del torneo
        config = ConfiguracionTorneo.obtener_para_edicion(edicion)
        if not config:
            raise CommandError("No existe ConfiguracionTorneo para esta edición.")

        # 4. Cargar rankings existentes en memoria para poder acumular sin re-leer DB
        rankings_db = {
            r.colaborador_id: r
            for r in RankingMundial.objects.filter(edicion=edicion).select_related("colaborador")
        }

        # Resetear contadores en memoria
        for r in rankings_db.values():
            r.puntos_partidos = 0
            r.aciertos_exactos = 0
            r.puntos_totales = 0

        # 5. Acumular puntos partido por partido (en memoria)
        totales = {"predicciones": 0, "exactos": 0, "ganadores": 0, "fallos": 0}
        predicciones_a_guardar = []

        for partido in partidos:
            predicciones = partido.predicciones.select_related("colaborador").all()
            for prediccion in predicciones:
                prediccion.calcular_puntos(config)
                totales["predicciones"] += 1

                if prediccion.es_acierto_exacto:
                    totales["exactos"] += 1
                elif prediccion.puntos_obtenidos and prediccion.puntos_obtenidos > 0:
                    totales["ganadores"] += 1
                else:
                    totales["fallos"] += 1

                predicciones_a_guardar.append(prediccion)

                # Obtener o crear ranking en memoria
                colab_id = prediccion.colaborador_id
                if colab_id not in rankings_db:
                    rankings_db[colab_id] = RankingMundial(
                        edicion=edicion,
                        colaborador=prediccion.colaborador,
                        puntos_partidos=0,
                        aciertos_exactos=0,
                        puntos_totales=0,
                    )

                r = rankings_db[colab_id]
                r.puntos_partidos += (prediccion.puntos_obtenidos or 0) + (prediccion.puntos_penaltis or 0)
                if prediccion.es_acierto_exacto:
                    r.aciertos_exactos += 1
                r.calcular_puntos_totales()

        # 6. Persistir cambios
        if not dry_run:
            with transaction.atomic():
                # Guardar predicciones
                from django.db.models import F
                for prediccion in predicciones_a_guardar:
                    prediccion.save(update_fields=["puntos_obtenidos", "puntos_penaltis", "es_acierto_exacto"])

                # Guardar rankings (update o create)
                rankings_existentes = []
                rankings_nuevos = []
                for r in rankings_db.values():
                    if r.pk:
                        rankings_existentes.append(r)
                    else:
                        rankings_nuevos.append(r)

                if rankings_existentes:
                    RankingMundial.objects.bulk_update(
                        rankings_existentes,
                        ["puntos_partidos", "aciertos_exactos", "puntos_totales"],
                        batch_size=200,
                    )
                if rankings_nuevos:
                    RankingMundial.objects.bulk_create(rankings_nuevos, batch_size=200)

                # Recalcular posiciones
                recalcular_posiciones_ranking(edicion)

            self.stdout.write(self.style.SUCCESS("Posiciones del ranking recalculadas."))

        # 7. Resumen
        self.stdout.write("\n--- RESUMEN ---")
        self.stdout.write(f"  Predicciones evaluadas : {totales['predicciones']}")
        self.stdout.write(f"  Aciertos exactos       : {totales['exactos']}")
        self.stdout.write(f"  Ganadores correctos    : {totales['ganadores']}")
        self.stdout.write(f"  Fallos                 : {totales['fallos']}")

        if not dry_run:
            self.stdout.write(f"\n  Rankings actualizados  : {len(rankings_db)}")
            self.stdout.write(self.style.SUCCESS("\nRecalculo completado exitosamente."))
        else:
            self.stdout.write(f"\n  Rankings a actualizar  : {len(rankings_db)}")
            # Vista previa del top 5 en dry-run
            top = sorted(rankings_db.values(), key=lambda r: (-r.puntos_totales, -r.aciertos_exactos))[:5]
            if top:
                self.stdout.write("\n  Top 5 (simulado):")
                for i, r in enumerate(top, 1):
                    nombre = f"{r.colaborador.nombrecolaborador} {r.colaborador.apellidocolaborador}".strip()
                    self.stdout.write(f"    {i}. {nombre} — {r.puntos_totales} pts ({r.aciertos_exactos} exactos)")
            self.stdout.write(self.style.WARNING("\nDRY-RUN completado — ningún cambio fue guardado."))
