from django.contrib import admin
from django.utils.html import format_html
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
    list_display = ("nombre", "bandera_display", "activo", "creado_en")
    list_filter = ("activo",)
    search_fields = ("nombre",)
    list_editable = ("activo",)
    fieldsets = (
        ("Información Básica", {
            "fields": ("nombre", "activo")
        }),
        ("Bandera", {
            "fields": ("bandera_imagen", "bandera_emoji"),
            "description": "Sube una imagen de la bandera o usa un emoji como respaldo"
        }),
        ("Auditoría", {
            "fields": ("creado_en", "actualizado_en"),
            "classes": ("collapse",)
        }),
    )
    readonly_fields = ("creado_en", "actualizado_en")
    
    def bandera_display(self, obj):
        if obj.bandera_emoji:
            return format_html(f"<span style='font-size: 1.5em;'>{obj.bandera_emoji}</span>")
        elif obj.bandera_imagen:
            return format_html(f'<img src="{obj.bandera_imagen.url}" style="height: 30px;" />')
        return "—"
    bandera_display.short_description = "Bandera"


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
    list_display = ("colaborador_nombre", "tipo", "respuesta", "puntos_obtenidos", "creado_en", "puede_editarse")
    list_filter = ("tipo", "creado_en", "puntos_obtenidos")
    search_fields = ("colaborador__nombrecolaborador", "colaborador__apellidocolaborador", "equipo_seleccionado__nombre", "jugador_seleccionado")
    readonly_fields = ("colaborador", "tipo", "creado_en", "actualizado_en", "config_info")
    
    fieldsets = (
        ("Información del Participante", {
            "fields": ("colaborador", "tipo")
        }),
        ("Respuesta", {
            "fields": ("equipo_seleccionado", "jugador_seleccionado")
        }),
        ("Puntuación", {
            "fields": ("puntos_obtenidos", "config_info"),
            "description": "Los puntos se asignan automáticamente cuando se resuelve la predicción"
        }),
        ("Auditoría", {
            "fields": ("creado_en", "actualizado_en"),
            "classes": ("collapse",)
        }),
    )
    
    def colaborador_nombre(self, obj):
        return f"{obj.colaborador.nombrecolaborador} {obj.colaborador.apellidocolaborador}"
    colaborador_nombre.short_description = "Participante"
    
    def respuesta(self, obj):
        if obj.equipo_seleccionado:
            return f"🏴 {obj.equipo_seleccionado.nombre}"
        elif obj.jugador_seleccionado:
            return f"⚽ {obj.jugador_seleccionado}"
        return "—"
    respuesta.short_description = "Respuesta"
    
    def puede_editarse(self, obj):
        if obj.puede_editarse():
            return format_html('<span style="color: green;">✓ Abierta</span>')
        else:
            return format_html('<span style="color: red;">✗ Cerrada</span>')
    puede_editarse.short_description = "Estado"
    
    def config_info(self, obj):
        config = obj._get_config()
        if config:
            return format_html(
                f"<strong>Puntos por acierto:</strong> {config.puntos_acierto}<br>"
                f"<strong>Estado:</strong> {config.get_estado_display()}<br>"
                f"<strong>Cierra:</strong> {config.fecha_cierre.strftime('%d/%m/%Y %H:%M')}"
            )
        return "No hay configuración disponible"
    config_info.short_description = "Información de Configuración"
    
    def has_add_permission(self, request):
        # Los usuarios responden a través de la API, no desde admin
        return False
    
    def has_delete_permission(self, request, obj=None):
        # No se deben eliminar respuestas una vez guardadas
        return False


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
    list_display = ("tipo", "edicion", "habilitada", "estado", "fecha_cierre", "puntos_acierto", "predicciones_respondidas")
    list_filter = ("estado", "habilitada", "edicion", "tipo")
    search_fields = ("tipo", "edicion__nombre")
    fieldsets = (
        ("Información General", {
            "fields": ("edicion", "tipo", "descripcion")
        }),
        ("Configuración de Puntuación", {
            "fields": ("puntos_acierto",),
            "description": "Puntos que gana el usuario si acierta esta predicción especial"
        }),
        ("Estado y Disponibilidad", {
            "fields": ("habilitada", "estado", "fecha_cierre"),
            "description": "Controla cuándo los usuarios pueden responder esta predicción"
        }),
        ("Auditoría", {
            "fields": ("creado_en", "actualizado_en"),
            "classes": ("collapse",)
        }),
    )
    readonly_fields = ("creado_en", "actualizado_en")
    
    def predicciones_respondidas(self, obj):
        count = PrediccionEspecial.objects.filter(tipo=obj.tipo).count()
        return format_html(f"<strong>{count}</strong> respondidas")
    predicciones_respondidas.short_description = "Participantes"
