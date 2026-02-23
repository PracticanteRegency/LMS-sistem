from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status

from usuarios.permissions import IsSuperUserOrAdmin

from .models import (
    EdicionMundial, Equipo, Partido, Prediccion, PrediccionEspecial,
    RankingMundial, ConfiguracionTorneo, ConfiguracionPrediccionEspecial,
    EstadoPartido,
)
from .serializers import (
    EdicionMundialSerializer,
    EquipoSerializer, EquipoCreateUpdateSerializer,
    PartidoSerializer, PartidoAdminSerializer,
    PartidoCreateUpdateSerializer, PartidoResultadoSerializer,
    PrediccionSerializer, PrediccionCreateSerializer,
    PrediccionEspecialSerializer,
    RankingSerializer,
    ConfiguracionTorneoSerializer,
    ConfiguracionPrediccionEspecialSerializer,
    EstadisticasSerializer,
)
from .utils import (
    obtener_edicion_activa,
    verificar_bloqueos_partidos,
    verificar_bloqueo_configuracion,
    evaluar_resultado_partido,
    obtener_ranking_top,
    obtener_posicion_usuario,
    registrar_primera_prediccion,
    obtener_estadisticas,
)


# ================================================================
# HELPERS INTERNOS
# ================================================================

def _get_colaborador(request):
    """Retorna el colaborador del usuario autenticado o None."""
    return getattr(request.user, "idcolaboradoru", None)


def _get_edicion_o_404(edicion_id=None):
    """Retorna la edición indicada o la activa, o 404."""
    if edicion_id:
        return get_object_or_404(EdicionMundial, pk=edicion_id)
    edicion = obtener_edicion_activa()
    if not edicion:
        return None
    return edicion


# ================================================================
# EDICIONES DEL MUNDIAL
# ================================================================

class EdicionMundialListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [AllowAny()]

    def get(self, request):
        ediciones = EdicionMundial.objects.all()
        return Response(EdicionMundialSerializer(ediciones, many=True).data)

    def post(self, request):
        serializer = EdicionMundialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EdicionMundialDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [AllowAny()]

    def get(self, request, pk):
        edicion = get_object_or_404(EdicionMundial, pk=pk)
        return Response(EdicionMundialSerializer(edicion).data)

    def put(self, request, pk):
        edicion = get_object_or_404(EdicionMundial, pk=pk)
        serializer = EdicionMundialSerializer(edicion, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ================================================================
# EQUIPOS
# ================================================================

class EquipoListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [AllowAny()]

    def get(self, request):
        """Lista todos los equipos activos."""
        equipos = Equipo.objects.filter(activo=True)
        return Response(EquipoSerializer(equipos, many=True, context={"request": request}).data)

    def post(self, request):
        """Admin crea un equipo nuevo."""
        serializer = EquipoCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        equipo = serializer.save()
        return Response(
            EquipoSerializer(equipo, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class EquipoDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [AllowAny()]

    def get(self, request, pk):
        equipo = get_object_or_404(Equipo, pk=pk)
        return Response(EquipoSerializer(equipo, context={"request": request}).data)

    def put(self, request, pk):
        """Admin edita un equipo. Si sube nueva imagen, la anterior se elimina automáticamente."""
        equipo = get_object_or_404(Equipo, pk=pk)
        serializer = EquipoCreateUpdateSerializer(equipo, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        equipo = serializer.save()
        return Response(EquipoSerializer(equipo, context={"request": request}).data)

    def delete(self, request, pk):
        """Admin desactiva un equipo (no lo elimina físicamente)."""
        equipo = get_object_or_404(Equipo, pk=pk)
        equipo.activo = False
        equipo.save(update_fields=["activo"])
        return Response({"message": f"Equipo '{equipo.nombre}' desactivado."})


# ================================================================
# PARTIDOS
# ================================================================

class PartidoListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        """
        Lista partidos para USUARIOS con su predicción personal embebida.
        Verifica automáticamente bloqueos pendientes.
        """
        edicion = _get_edicion_o_404()
        if not edicion:
            return Response({"partidos": [], "total": 0, "equipos": [], "estadisticas": {}})

        # Bloquear partidos que ya deben cerrarse
        verificar_bloqueos_partidos(edicion)
        verificar_bloqueo_configuracion(edicion)

        qs = Partido.objects.filter(edicion=edicion).select_related(
            "equipo_local", "equipo_visitante"
        )

        # Filtros opcionales
        fase = request.query_params.get("fase")
        grupo = request.query_params.get("grupo")
        estado_filtro = request.query_params.get("estado")
        search = request.query_params.get("search")

        if fase:
            qs = qs.filter(fase=fase)
        if grupo:
            qs = qs.filter(grupo=grupo)
        if estado_filtro:
            qs = qs.filter(estado=estado_filtro)
        if search:
            qs = qs.filter(
                equipo_local__nombre__icontains=search
            ) | qs.filter(equipo_visitante__nombre__icontains=search)

        partidos = PartidoSerializer(qs, many=True, context={"request": request}).data
        colaborador = _get_colaborador(request)

        estadisticas = {
            "total_partidos": qs.count(),
            "partidos_predichos": (
                Prediccion.objects.filter(
                    partido__edicion=edicion, colaborador=colaborador
                ).count() if colaborador else 0
            ),
            "partidos_pendientes": qs.exclude(estado=EstadoPartido.FINALIZADO).count(),
        }

        equipos = Equipo.objects.filter(activo=True)
        equipos_data = EquipoSerializer(equipos, many=True, context={"request": request}).data

        return Response({
            "partidos": partidos,
            "total": qs.count(),
            "equipos": equipos_data,  # 48 selecciones
            "estadisticas": estadisticas,
        })

    def post(self, request):
        """Admin crea un partido."""
        serializer = PartidoCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        partido = serializer.save()
        return Response(
            PartidoAdminSerializer(partido, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PartidoAdminListView(APIView):
    """Lista de partidos para administradores — sin predicciones propias, con stats de control."""
    permission_classes = [IsAuthenticated, IsSuperUserOrAdmin]

    def get(self, request):
        edicion = _get_edicion_o_404()
        if not edicion:
            return Response({"partidos": [], "total": 0})

        verificar_bloqueos_partidos(edicion)

        qs = Partido.objects.filter(edicion=edicion).select_related(
            "equipo_local", "equipo_visitante"
        )
        fase = request.query_params.get("fase")
        estado_filtro = request.query_params.get("estado")
        if fase:
            qs = qs.filter(fase=fase)
        if estado_filtro:
            qs = qs.filter(estado=estado_filtro)

        data = PartidoAdminSerializer(qs, many=True, context={"request": request}).data
        return Response({"partidos": data, "total": qs.count()})


class PartidoDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        partido = get_object_or_404(Partido, pk=pk)
        partido.verificar_y_bloquear()
        serializer_class = PartidoAdminSerializer if request.user.is_staff else PartidoSerializer
        return Response(serializer_class(partido, context={"request": request}).data)

    def put(self, request, pk):
        """Admin edita un partido. Solo permitido si está ABIERTO."""
        partido = get_object_or_404(Partido, pk=pk)
        if not partido.puede_editar_admin():
            return Response(
                {"error": "No se puede editar un partido que no está en estado ABIERTO."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = PartidoCreateUpdateSerializer(partido, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        partido = serializer.save()
        return Response(PartidoAdminSerializer(partido, context={"request": request}).data)

    def delete(self, request, pk):
        """Admin elimina un partido y todas sus predicciones. Solo si está ABIERTO."""
        partido = get_object_or_404(Partido, pk=pk)
        if not partido.puede_editar_admin():
            return Response(
                {"error": "No se puede eliminar un partido que ya está BLOQUEADO o FINALIZADO."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        total_predicciones = partido.predicciones.count()
        partido.delete()
        return Response({
            "message": "Partido eliminado.",
            "predicciones_eliminadas": total_predicciones,
        })


class PartidoResultadoView(APIView):
    """Registra el resultado final de un partido (solo admin, partido BLOQUEADO)."""
    permission_classes = [IsAuthenticated, IsSuperUserOrAdmin]

    def post(self, request, pk):
        partido = get_object_or_404(Partido, pk=pk)

        if not partido.puede_ingresar_resultado():
            return Response(
                {"error": f"No se puede ingresar resultado: el partido está en estado '{partido.estado}'. "
                          "Solo se puede para partidos BLOQUEADOS."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PartidoResultadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        resumen = evaluar_resultado_partido(
            partido=partido,
            goles_local=datos["goles_local"],
            goles_visitante=datos["goles_visitante"],
            fue_a_penaltis=datos.get("fue_a_penaltis", False),
            penaltis_local=datos.get("penaltis_local"),
            penaltis_visitante=datos.get("penaltis_visitante"),
        )

        return Response({
            "partido": PartidoAdminSerializer(partido, context={"request": request}).data,
            "puntos_calculados": True,
            "resumen": resumen,
        })


# ================================================================
# PREDICCIONES
# ================================================================

class PrediccionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista las predicciones del usuario autenticado."""
        colaborador = _get_colaborador(request)
        if not colaborador:
            return Response({"error": "Usuario sin colaborador asociado."}, status=400)

        edicion = _get_edicion_o_404()
        predicciones = Prediccion.objects.filter(
            colaborador=colaborador,
            partido__edicion=edicion,
        ).select_related("partido__equipo_local", "partido__equipo_visitante")

        return Response({
            "predicciones": PrediccionSerializer(predicciones, many=True).data,
            "total": predicciones.count(),
        })

    def post(self, request):
        """Crea o actualiza la predicción de un partido para el usuario."""
        colaborador = _get_colaborador(request)
        if not colaborador:
            return Response({"error": "Usuario sin colaborador asociado."}, status=400)

        partido_id = request.data.get("partido")
        partido = get_object_or_404(Partido, pk=partido_id)

        # Verificar estado del partido
        partido.verificar_y_bloquear()
        if not partido.puede_predecir():
            return Response(
                {"error": "PARTIDO_CERRADO",
                 "message": f"Las predicciones para este partido están cerradas (estado: {partido.estado})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Crear o actualizar predicción
        prediccion_existente = Prediccion.objects.filter(
            colaborador=colaborador, partido=partido
        ).first()

        serializer = PrediccionCreateSerializer(
            prediccion_existente, data=request.data, partial=bool(prediccion_existente)
        )
        serializer.is_valid(raise_exception=True)
        prediccion = serializer.save(colaborador=colaborador)

        # Registrar fecha primera predicción para desempate en ranking
        if partido.edicion:
            registrar_primera_prediccion(colaborador, partido.edicion, prediccion.creado_en)

        created = prediccion_existente is None
        return Response(
            PrediccionSerializer(prediccion).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ================================================================
# PREDICCIONES ESPECIALES
# ================================================================

class PrediccionEspecialListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista las predicciones especiales del usuario."""
        colaborador = _get_colaborador(request)
        if not colaborador:
            return Response({"error": "Usuario sin colaborador asociado."}, status=400)

        predicciones = PrediccionEspecial.objects.filter(
            colaborador=colaborador
        ).select_related("equipo_seleccionado")

        return Response({
            "predicciones": PrediccionEspecialSerializer(predicciones, many=True).data,
        })

    def post(self, request):
        """Crea o actualiza una predicción especial del usuario."""
        colaborador = _get_colaborador(request)
        if not colaborador:
            return Response({"error": "Usuario sin colaborador asociado."}, status=400)

        tipo = request.data.get("tipo")
        existente = PrediccionEspecial.objects.filter(
            colaborador=colaborador, tipo=tipo
        ).first()

        serializer = PrediccionEspecialSerializer(
            existente, data=request.data, partial=bool(existente)
        )
        serializer.is_valid(raise_exception=True)
        prediccion = serializer.save(colaborador=colaborador)

        created = existente is None
        return Response(
            PrediccionEspecialSerializer(prediccion).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ================================================================
# RANKING
# ================================================================

class RankingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna el top 10 del ranking y la posición del usuario actual."""
        edicion = _get_edicion_o_404()
        if not edicion:
            return Response({"ranking": [], "mi_posicion": None})

        limite = int(request.query_params.get("limite", 10))
        top = obtener_ranking_top(edicion, limite)

        colaborador = _get_colaborador(request)
        mi_ranking = obtener_posicion_usuario(edicion, colaborador) if colaborador else None

        return Response({
            "ranking": RankingSerializer(top, many=True).data,
            "total_participantes": RankingMundial.objects.filter(edicion=edicion).count(),
            "mi_posicion": RankingSerializer(mi_ranking).data if mi_ranking else None,
        })


# ================================================================
# CONFIGURACION TORNEO
# ================================================================

class ConfiguracionTorneoView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [AllowAny()]

    def get(self, request):
        """Cualquier usuario puede ver la configuración (multiplicadores, puntos, premios)."""
        edicion = _get_edicion_o_404()
        config = ConfiguracionTorneo.obtener_para_edicion(edicion)
        return Response(ConfiguracionTorneoSerializer(config).data)

    def put(self, request):
        """Solo admin puede editar, y solo antes de que inicie el mundial."""
        edicion = _get_edicion_o_404()
        if not edicion:
            return Response({"error": "No hay edición activa."}, status=404)
        config = ConfiguracionTorneo.obtener_para_edicion(edicion)
        if not config.puede_editarse():
            return Response(
                {"error": "La configuración está bloqueada porque el mundial ya ha iniciado."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ConfiguracionTorneoSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ================================================================
# CONFIGURACION PREDICCIONES ESPECIALES
# ================================================================

class ConfiguracionPrediccionEspecialListView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [AllowAny()]

    def get(self, request):
        """Todos pueden ver la lista de predicciones especiales habilitadas."""
        edicion = _get_edicion_o_404()
        configs = ConfiguracionPrediccionEspecial.objects.filter(
            edicion=edicion, habilitada=True
        ) if edicion else ConfiguracionPrediccionEspecial.objects.none()
        return Response(ConfiguracionPrediccionEspecialSerializer(configs, many=True).data)

    def post(self, request):
        """Admin crea una configuración de predicción especial."""
        serializer = ConfiguracionPrediccionEspecialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConfiguracionPrediccionEspecialDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrAdmin]

    def put(self, request, pk):
        """Admin edita una configuración especial, bloqueado cuando inicia el mundial."""
        config = get_object_or_404(ConfiguracionPrediccionEspecial, pk=pk)
        edicion = config.edicion
        if edicion and edicion.bloqueo_configuracion:
            return Response(
                {"error": "No se puede editar: el mundial ya ha iniciado."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ConfiguracionPrediccionEspecialSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ================================================================
# ESTADISTICAS (homepage / listado de partidos)
# ================================================================

class EstadisticasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        edicion = _get_edicion_o_404()
        if not edicion:
            return Response({"error": "No hay edición activa."}, status=404)

        colaborador = _get_colaborador(request)
        stats = obtener_estadisticas(edicion, colaborador)
        return Response(EstadisticasSerializer(stats).data)
