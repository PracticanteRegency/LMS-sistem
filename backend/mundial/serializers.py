from rest_framework import serializers
from .models import (
    EdicionMundial, Equipo, Partido, Prediccion, PrediccionEspecial,
    RankingMundial, ConfiguracionTorneo, ConfiguracionPrediccionEspecial,
    get_nombre_completo, EstadoPartido,
)


# ================================================================
# EDICION MUNDIAL
# ================================================================

class EdicionMundialSerializer(serializers.ModelSerializer):
    primer_partido_fecha = serializers.SerializerMethodField()
    esta_iniciado = serializers.SerializerMethodField()

    class Meta:
        model = EdicionMundial
        fields = [
            "id", "nombre", "anio", "activa", "bloqueo_configuracion",
            "primer_partido_fecha", "esta_iniciado", "creado_en",
        ]
        read_only_fields = ["bloqueo_configuracion"]

    def get_primer_partido_fecha(self, obj):
        partido = obj.primer_partido()
        if partido:
            return f"{partido.fecha} {partido.hora}"
        return None

    def get_esta_iniciado(self, obj):
        return obj.esta_iniciado()


# ================================================================
# EQUIPOS
# ================================================================

class EquipoSerializer(serializers.ModelSerializer):
    bandera = serializers.SerializerMethodField()

    class Meta:
        model = Equipo
        fields = ["id", "nombre", "bandera", "bandera_emoji", "activo"]

    def get_bandera(self, obj):
        request = self.context.get("request")
        if obj.bandera_imagen and request:
            return request.build_absolute_uri(obj.bandera_imagen.url)
        return obj.bandera_emoji or ""


class EquipoCreateUpdateSerializer(serializers.ModelSerializer):
    bandera_imagen = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Equipo
        fields = ["nombre", "bandera_imagen", "bandera_emoji", "activo"]


# ================================================================
# PREDICCION RESUMEN (embebida dentro de Partido)
# ================================================================

class PrediccionResumenSerializer(serializers.ModelSerializer):
    puntos_totales = serializers.SerializerMethodField()

    class Meta:
        model = Prediccion
        fields = [
            "id", "goles_local", "goles_visitante", "ganador",
            "predice_penaltis", "penaltis_local", "penaltis_visitante", "ganador_penaltis",
            "puntos_obtenidos", "puntos_penaltis", "puntos_totales", "es_acierto_exacto",
        ]

    def get_puntos_totales(self, obj):
        return obj.puntos_totales()


# ================================================================
# PARTIDOS
# ================================================================

class PartidoSerializer(serializers.ModelSerializer):
    """Vista de partido para usuarios — incluye predicción propia si existe."""
    equipo_local_nombre = serializers.CharField(source="equipo_local.nombre", read_only=True)
    equipo_local_bandera = serializers.SerializerMethodField()
    equipo_visitante_nombre = serializers.CharField(source="equipo_visitante.nombre", read_only=True)
    equipo_visitante_bandera = serializers.SerializerMethodField()
    resultado = serializers.SerializerMethodField()
    puede_predecir = serializers.SerializerMethodField()
    mi_prediccion = serializers.SerializerMethodField()

    class Meta:
        model = Partido
        fields = [
            "id", "edicion",
            "equipo_local", "equipo_local_nombre", "equipo_local_bandera",
            "equipo_visitante", "equipo_visitante_nombre", "equipo_visitante_bandera",
            "fecha", "hora", "fase", "grupo", "multiplicador", "estado",
            "resultado", "fue_a_penaltis",
            "puede_predecir", "mi_prediccion",
        ]

    def get_equipo_local_bandera(self, obj):
        return self._bandera(obj.equipo_local)

    def get_equipo_visitante_bandera(self, obj):
        return self._bandera(obj.equipo_visitante)

    def _bandera(self, equipo):
        request = self.context.get("request")
        if equipo.bandera_imagen and request:
            return request.build_absolute_uri(equipo.bandera_imagen.url)
        return equipo.bandera_emoji or ""

    def get_resultado(self, obj):
        return obj.resultado

    def get_puede_predecir(self, obj):
        return obj.puede_predecir()

    def get_mi_prediccion(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        colaborador = getattr(request.user, "idcolaboradoru", None)
        if not colaborador:
            return None
        pred = obj.predicciones.filter(colaborador=colaborador).first()
        return PrediccionResumenSerializer(pred).data if pred else None


class PartidoAdminSerializer(PartidoSerializer):
    """Vista de partido para admin — sin mi_prediccion, con estadísticas de control."""
    total_predicciones = serializers.SerializerMethodField()
    puede_editar = serializers.SerializerMethodField()
    puede_ingresar_resultado = serializers.SerializerMethodField()

    class Meta(PartidoSerializer.Meta):
        fields = PartidoSerializer.Meta.fields + [
            "total_predicciones", "puede_editar", "puede_ingresar_resultado",
            "goles_local", "goles_visitante", "penaltis_local", "penaltis_visitante",
        ]

    def get_mi_prediccion(self, obj):
        return None  # Admin no ve sus predicciones en la vista de administración

    def get_total_predicciones(self, obj):
        return obj.predicciones.count()

    def get_puede_editar(self, obj):
        return obj.puede_editar_admin()

    def get_puede_ingresar_resultado(self, obj):
        return obj.puede_ingresar_resultado()


class PartidoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partido
        fields = ["edicion", "equipo_local", "equipo_visitante", "fecha", "hora", "fase", "grupo", "estado"]

    def validate(self, data):
        local = data.get("equipo_local") or getattr(self.instance, "equipo_local", None)
        visitante = data.get("equipo_visitante") or getattr(self.instance, "equipo_visitante", None)
        if local and visitante and local == visitante:
            raise serializers.ValidationError("El equipo local y visitante no pueden ser el mismo.")

        # Validar que el partido pueda editarse (si es actualización)
        if self.instance and not self.instance.puede_editar_admin():
            raise serializers.ValidationError(
                "No se puede editar este partido. Solo se pueden editar partidos en estado ABIERTO."
            )
        
        # Si es actualización y el partido está cerrado, no permitir cambiar equipos
        if self.instance and self.instance.estado != EstadoPartido.ABIERTO:
            if data.get("equipo_local") or data.get("equipo_visitante"):
                raise serializers.ValidationError(
                    "No se pueden cambiar los equipos de un partido que ya está cerrado o finalizado."
                )
        
        return data

    def _asignar_multiplicador(self, validated_data):
        """Asigna el multiplicador automáticamente según la fase y edición."""
        fase = validated_data.get("fase") or getattr(self.instance, "fase", None)
        edicion = validated_data.get("edicion") or getattr(self.instance, "edicion", None)
        if edicion and fase:
            try:
                config = ConfiguracionTorneo.objects.get(edicion=edicion)
                validated_data["multiplicador"] = config.obtener_multiplicador_por_fase(fase)
            except ConfiguracionTorneo.DoesNotExist:
                pass
        return validated_data

    def create(self, validated_data):
        # Forzar que los partidos nuevos se creen en estado ABIERTO
        validated_data["estado"] = EstadoPartido.ABIERTO
        validated_data = self._asignar_multiplicador(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._asignar_multiplicador(validated_data)
        return super().update(instance, validated_data)


class PartidoResultadoSerializer(serializers.Serializer):
    """Datos para registrar el resultado final de un partido (solo admin)."""
    goles_local = serializers.IntegerField(min_value=0)
    goles_visitante = serializers.IntegerField(min_value=0)
    fue_a_penaltis = serializers.BooleanField(default=False)
    penaltis_local = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    penaltis_visitante = serializers.IntegerField(min_value=0, required=False, allow_null=True)

    def validate(self, data):
        fue_a_penaltis = data.get("fue_a_penaltis", False)
        if fue_a_penaltis:
            if data["goles_local"] != data["goles_visitante"]:
                raise serializers.ValidationError(
                    "Solo puede haber penaltis si el partido termina en empate."
                )
            if data.get("penaltis_local") is None or data.get("penaltis_visitante") is None:
                raise serializers.ValidationError("Debes indicar el marcador de penaltis.")
            if data["penaltis_local"] == data["penaltis_visitante"]:
                raise serializers.ValidationError("Los penaltis no pueden terminar en empate.")
        return data


# ================================================================
# PREDICCIONES
# ================================================================

class PrediccionSerializer(serializers.ModelSerializer):
    nombre_partido = serializers.SerializerMethodField()
    puntos_totales = serializers.SerializerMethodField()

    class Meta:
        model = Prediccion
        fields = [
            "id", "partido", "nombre_partido",
            "goles_local", "goles_visitante", "ganador",
            "predice_penaltis", "penaltis_local", "penaltis_visitante", "ganador_penaltis",
            "puntos_obtenidos", "puntos_penaltis", "puntos_totales", "es_acierto_exacto",
            "creado_en", "actualizado_en",
        ]
        read_only_fields = ["puntos_obtenidos", "puntos_penaltis", "es_acierto_exacto"]

    def get_nombre_partido(self, obj):
        return str(obj.partido)

    def get_puntos_totales(self, obj):
        return obj.puntos_totales()

    def validate(self, data):
        partido = data.get("partido") or getattr(self.instance, "partido", None)
        if not partido:
            raise serializers.ValidationError("Debes indicar un partido.")

        if not partido.puede_predecir():
            raise serializers.ValidationError({
                "error": "PARTIDO_CERRADO",
                "message": f"Las predicciones para este partido están cerradas (estado: {partido.estado}).",
            })

        goles_local = data.get("goles_local", 0)
        goles_visitante = data.get("goles_visitante", 0)
        ganador = data.get("ganador")

        # Coherencia ganador ↔ marcador
        if goles_local > goles_visitante and ganador != "local":
            raise serializers.ValidationError("El ganador indicado no coincide con el marcador.")
        if goles_visitante > goles_local and ganador != "visitante":
            raise serializers.ValidationError("El ganador indicado no coincide con el marcador.")
        if goles_local == goles_visitante and ganador != "empate":
            raise serializers.ValidationError("El marcador es empate pero el ganador indicado no lo es.")

        # Penaltis
        predice_penaltis = data.get("predice_penaltis", False)
        if predice_penaltis:
            if ganador != "empate":
                raise serializers.ValidationError("Solo puedes predecir penaltis si predices empate.")
            pen_local = data.get("penaltis_local")
            pen_visitante = data.get("penaltis_visitante")
            ganador_pen = data.get("ganador_penaltis")
            if pen_local is None or pen_visitante is None:
                raise serializers.ValidationError("Debes indicar el marcador de penaltis.")
            if pen_local == pen_visitante:
                raise serializers.ValidationError("Los penaltis no pueden terminar en empate.")
            if not ganador_pen:
                raise serializers.ValidationError("Debes indicar el ganador de los penaltis.")
            if pen_local > pen_visitante and ganador_pen != "local":
                raise serializers.ValidationError("El ganador de penaltis no coincide con el marcador.")
            if pen_visitante > pen_local and ganador_pen != "visitante":
                raise serializers.ValidationError("El ganador de penaltis no coincide con el marcador.")
        return data


class PrediccionCreateSerializer(PrediccionSerializer):
    class Meta(PrediccionSerializer.Meta):
        fields = [
            "partido", "goles_local", "goles_visitante", "ganador",
            "predice_penaltis", "penaltis_local", "penaltis_visitante", "ganador_penaltis",
        ]


# ================================================================
# PREDICCIONES ESPECIALES
# ================================================================

class PrediccionEspecialSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    equipo_nombre = serializers.SerializerMethodField()
    equipo_bandera = serializers.SerializerMethodField()
    equipo_emoji = serializers.SerializerMethodField()
    puede_editar = serializers.SerializerMethodField()
    fecha_cierre = serializers.SerializerMethodField()

    class Meta:
        model = PrediccionEspecial
        fields = [
            "id", "tipo", "tipo_display",
            "equipo_seleccionado", "equipo_nombre", "equipo_bandera", "equipo_emoji",
            "jugador_seleccionado",
            "puntos_obtenidos", "puede_editar", "fecha_cierre",
            "creado_en", "actualizado_en",
        ]
        read_only_fields = ["puntos_obtenidos", "creado_en", "actualizado_en"]

    def get_equipo_nombre(self, obj):
        return obj.equipo_seleccionado.nombre if obj.equipo_seleccionado else None

    def get_equipo_bandera(self, obj):
        if not obj.equipo_seleccionado:
            return None
        # Retorna URL de imagen si existe (igual que en partidos)
        request = self.context.get("request")
        if obj.equipo_seleccionado.bandera_imagen and request:
            try:
                return request.build_absolute_uri(obj.equipo_seleccionado.bandera_imagen.url)
            except Exception:
                # Si hay error, devolver emoji
                return obj.equipo_seleccionado.bandera_emoji or ""
        return obj.equipo_seleccionado.bandera_emoji or ""

    def get_equipo_emoji(self, obj):
        return obj.equipo_seleccionado.bandera_emoji if obj.equipo_seleccionado else None

    def get_puede_editar(self, obj):
        return obj.puede_editarse()

    def get_fecha_cierre(self, obj):
        config = obj._get_config()
        return config.fecha_cierre.isoformat() if config else None

    def create(self, validated_data):
        colaborador = self.context.get("colaborador")
        if not colaborador:
            raise serializers.ValidationError("Colaborador no especificado")
        validated_data["colaborador"] = colaborador
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
    

class PrediccionEspecialRespuestaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = PrediccionEspecial
        fields = [
            "id", "tipo", "tipo_display",
            "equipo_seleccionado", "jugador_seleccionado",
            "puntos_obtenidos",
        ]


# ================================================================
# RANKING
# ================================================================

class RankingSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()
    iniciales = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    tendencia_str = serializers.SerializerMethodField()

    class Meta:
        model = RankingMundial
        fields = [
            "posicion", "nombre", "iniciales", "email",
            "puntos_totales", "puntos_partidos", "puntos_especiales",
            "aciertos_exactos", "predicciones_especiales_acertadas",
            "tendencia", "tendencia_str",
        ]

    def get_nombre(self, obj):
        return get_nombre_completo(obj.colaborador)

    def get_iniciales(self, obj):
        partes = get_nombre_completo(obj.colaborador).split()
        if len(partes) >= 2:
            return (partes[0][0] + partes[-1][0]).upper()
        return partes[0][0].upper() if partes else "?"

    def get_email(self, obj):
        return obj.colaborador.correocolaborador

    def get_tendencia_str(self, obj):
        return f"+{obj.tendencia}" if obj.tendencia > 0 else str(obj.tendencia)


# ================================================================
# CONFIGURACION TORNEO
# ================================================================

class ConfiguracionTorneoSerializer(serializers.ModelSerializer):
    multiplicadores = serializers.SerializerMethodField()
    puede_editarse = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracionTorneo
        fields = [
            "id", "edicion",
            # Puntuación
            "puntos_resultado_exacto", "puntos_ganador_correcto",
            # Multiplicadores
            "multiplicador_grupos", "multiplicador_dieciseisavos", "multiplicador_octavos",
            "multiplicador_cuartos", "multiplicador_semifinales", "multiplicador_tercer_puesto",
            "multiplicador_final", "multiplicadores",
            # Premios
            "porcentaje_primer_lugar", "porcentaje_segundo_lugar", "porcentaje_tercer_lugar",
            "fondo_premios_total",
            # Estado
            "puede_editarse", "actualizado_en",
        ]
        read_only_fields = ["actualizado_en", "puede_editarse"]

    def get_multiplicadores(self, obj):
        return {
            "Grupos": obj.multiplicador_grupos,
            "16avos": obj.multiplicador_dieciseisavos,
            "Octavos": obj.multiplicador_octavos,
            "Cuartos": obj.multiplicador_cuartos,
            "Semifinales": obj.multiplicador_semifinales,
            "Tercer Puesto": obj.multiplicador_tercer_puesto,
            "Final": obj.multiplicador_final,
        }

    def get_puede_editarse(self, obj):
        return obj.puede_editarse()

    def validate(self, data):
        edicion = data.get("edicion") or getattr(self.instance, "edicion", None)
        if edicion and edicion.bloqueo_configuracion:
            raise serializers.ValidationError(
                "No se puede editar la configuración: el mundial ya ha iniciado."
            )
        return data


# ================================================================
# CONFIGURACION PREDICCIONES ESPECIALES
# ================================================================

class ConfiguracionPrediccionEspecialSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    esta_abierta = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracionPrediccionEspecial
        fields = [
            "id", "edicion", "tipo", "tipo_display", "habilitada",
            "fecha_cierre", "descripcion", "estado", "puntos_acierto", "esta_abierta",
        ]

    def get_esta_abierta(self, obj):
        return obj.esta_abierta()


# ================================================================
# ESTADISTICAS (homepage)
# ================================================================

class EstadisticasSerializer(serializers.Serializer):
    total_participantes = serializers.IntegerField()
    total_partidos = serializers.IntegerField()
    partidos_jugados = serializers.IntegerField()
    partidos_pendientes = serializers.IntegerField()
    total_equipos = serializers.IntegerField()
    total_predicciones = serializers.IntegerField()
    partidos_predichos_usuario = serializers.IntegerField()
    fondo_premios = serializers.CharField()

