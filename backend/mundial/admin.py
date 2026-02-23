from django.contrib import admin
from .models import (
    EdicionMundial, Equipo, Partido, Prediccion,
    PrediccionEspecial, RankingMundial,
    ConfiguracionTorneo, ConfiguracionPrediccionEspecial,
)


@admin.register(EdicionMundial)
class EdicionMundialAdmin(admin.ModelAdmin):
    list_display = ("nombre", "anio", "activa", "bloqueo_configuracion", "creado_en")
    list_filter = ("activa",)
    search_fields = ("nombre",)


@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "bandera_emoji", "activo")
    list_filter = ("activo",)
    search_fields = ("nombre",)


@admin.register(Partido)
class PartidoAdmin(admin.ModelAdmin):
    list_display = ("__str__", "fase", "estado", "fecha", "hora", "edicion")
    list_filter = ("estado", "fase", "edicion")
    search_fields = ("equipo_local__nombre", "equipo_visitante__nombre")
    date_hierarchy = "fecha"


@admin.register(Prediccion)
class PrediccionAdmin(admin.ModelAdmin):
    list_display = ("colaborador", "partido", "goles_local", "goles_visitante", "puntos_obtenidos", "es_acierto_exacto")
    list_filter = ("es_acierto_exacto", "partido__edicion")
    search_fields = ("colaborador__nombrecolaborador", "colaborador__apellidocolaborador")


@admin.register(PrediccionEspecial)
class PrediccionEspecialAdmin(admin.ModelAdmin):
    list_display = ("colaborador", "tipo", "equipo_seleccionado", "jugador_seleccionado", "puntos_obtenidos")
    list_filter = ("tipo",)


@admin.register(RankingMundial)
class RankingMundialAdmin(admin.ModelAdmin):
    list_display = ("posicion", "colaborador", "puntos_totales", "puntos_partidos", "puntos_especiales", "aciertos_exactos", "edicion")
    list_filter = ("edicion",)
    ordering = ("posicion",)


@admin.register(ConfiguracionTorneo)
class ConfiguracionTorneoAdmin(admin.ModelAdmin):
    list_display = ("edicion", "puntos_resultado_exacto", "puntos_ganador_correcto", "fondo_premios_total")


@admin.register(ConfiguracionPrediccionEspecial)
class ConfiguracionPrediccionEspecialAdmin(admin.ModelAdmin):
    list_display = ("tipo", "edicion", "habilitada", "estado", "fecha_cierre", "puntos_acierto")
    list_filter = ("estado", "habilitada", "edicion")
