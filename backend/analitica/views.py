from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from decimal import Decimal

from django.db.models import Count, Avg, Q, Prefetch
from django.db import transaction
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from django.conf import settings

from usuarios.permissions import IsSuperAdmin

from .models import Epresa, Unidadnegocio, Proyecto, Centroop
from usuarios.models import Colaboradores
from .serializers import (
	EpresaSerializer,
	UnidadNegocioSerializer,
	ProyectoSerializer,
	ProyectoConUnidadSerializer,
	CentroOpSerializer,
	CentroOpSimpleSerializer,
	CargarEstructuraSerializer,
)
from rest_framework.permissions import IsAuthenticated, IsAdminUser


# --- Analítica ---
class ProgresoEmpresarialView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    """
    Retorna la analítica completa:
    Empresa → Unidad → Proyecto → Centro OP

    Optimización:
    - Cache de 30 minutos (datos pesados que no cambian frecuentemente)
    - Prefetch de toda la jerarquía en pocas queries
    - Annotate para calcular promedios en BD
    """
    CACHE_KEY = 'progreso_empresarial_completo'

    def get(self, request):
        # Intentar obtener de cache primero
        cache_ttl = getattr(settings, 'CACHE_TTL_PROGRESO_EMPRESARIAL', 1800)  # 30 min default
        cached_data = cache.get(self.CACHE_KEY)

        if cached_data is not None:
            return Response(cached_data)

        # Precalcular promedios por centro en una sola query
        centros_con_promedio = Centroop.objects.filter(
            estadocentrop=1
        ).annotate(
            promedio_progreso=Avg(
                'colaboradores__progresocapacitaciones__progreso',
                filter=~Q(colaboradores__progresocapacitaciones__capacitacion__estado=3)
            )
        ).select_related('id_proyecto__id_unidad__id_empresa')

        # Crear mapa de centros con sus promedios
        centros_map = {}
        for centro in centros_con_promedio:
            proyecto = centro.id_proyecto
            if proyecto:
                unidad = proyecto.id_unidad
                if unidad:
                    empresa = unidad.id_empresa
                    if empresa and empresa.estadoempresa == 1:
                        key = (empresa.idempresa, unidad.idunidad, proyecto.idproyecto)
                        if key not in centros_map:
                            centros_map[key] = {
                                'empresa': empresa,
                                'unidad': unidad,
                                'proyecto': proyecto,
                                'centros': []
                            }
                        centros_map[key]['centros'].append({
                            'nombre': centro.nombrecentrop.strip(),
                            'promedio': float(centro.promedio_progreso or 0)
                        })


        # Construir respuesta jerárquica SOLO con empresas en estado 1
        empresas_dict = {}

        for key, data in centros_map.items():
            empresa = data['empresa']
            if getattr(empresa, 'estadoempresa', None) != 1:
                continue
            unidad = data['unidad']
            proyecto = data['proyecto']

            # Inicializar empresa si no existe
            if empresa.idempresa not in empresas_dict:
                empresas_dict[empresa.idempresa] = {
                    "empresa": empresa.nombre_empresa.strip(),
                    "tipo": "empresa",
                    "porcentaje": 0,
                    "unidades": {},
                    "_promedios": []
                }

            empresa_dict = empresas_dict[empresa.idempresa]

            # Inicializar unidad si no existe
            if unidad.idunidad not in empresa_dict["unidades"]:
                empresa_dict["unidades"][unidad.idunidad] = {
                    "unidad": unidad.nombreunidad.strip(),
                    "tipo": "unidad",
                    "porcentaje": 0,
                    "proyectos": {},
                    "_promedios": []
                }

            unidad_dict = empresa_dict["unidades"][unidad.idunidad]

            # Inicializar proyecto si no existe
            if proyecto.idproyecto not in unidad_dict["proyectos"]:
                unidad_dict["proyectos"][proyecto.idproyecto] = {
                    "proyecto": proyecto.nombreproyecto.strip(),
                    "tipo": "proyecto",
                    "porcentaje": 0,
                    "centrosop": []
                }

            proyecto_dict = unidad_dict["proyectos"][proyecto.idproyecto]

            # Agregar centros
            centro_promedios = []
            for centro_data in data['centros']:
                proyecto_dict["centrosop"].append({
                    "centro_op": centro_data['nombre'],
                    "porcentaje": round(centro_data['promedio'], 2),
                    "tipo": "centro_op"
                })
                centro_promedios.append(centro_data['promedio'])

            # Calcular promedio del proyecto
            if centro_promedios:
                proyecto_promedio = sum(centro_promedios) / len(centro_promedios)
                proyecto_dict["porcentaje"] = round(proyecto_promedio, 2)
                unidad_dict["_promedios"].append(proyecto_promedio)

        # Calcular promedios de unidades y empresas
        for empresa_id, empresa_dict in empresas_dict.items():
            for unidad_id, unidad_dict in empresa_dict["unidades"].items():
                if unidad_dict["_promedios"]:
                    unidad_promedio = sum(unidad_dict["_promedios"]) / len(unidad_dict["_promedios"])
                    unidad_dict["porcentaje"] = round(unidad_promedio, 2)
                    empresa_dict["_promedios"].append(unidad_promedio)

            if empresa_dict["_promedios"]:
                empresa_dict["porcentaje"] = round(
                    sum(empresa_dict["_promedios"]) / len(empresa_dict["_promedios"]), 2
                )

        # Convertir dicts a listas y limpiar campos temporales
        response = []
        for empresa_dict in empresas_dict.values():
            empresa_dict["unidades"] = list(empresa_dict["unidades"].values())
            for unidad_dict in empresa_dict["unidades"]:
                unidad_dict["proyectos"] = list(unidad_dict["proyectos"].values())
                del unidad_dict["_promedios"]
            del empresa_dict["_promedios"]
            response.append(empresa_dict)

        # Guardar en cache
        cache.set(self.CACHE_KEY, response, cache_ttl)

        return Response(response)


class ProgresoEmpresarialFiltradoView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    """Resumen filtrado por empresa, unidad o proyecto (query params).

    Parámetros soportados: empresa_id, unidad_id, proyecto_id.
    """

    def get(self, request):
        empresa_id = request.query_params.get("empresa_id")
        unidad_id = request.query_params.get("unidad_id")
        proyecto_id = request.query_params.get("proyecto_id")

        empresas_qs = Epresa.objects.all()
        unidades_qs = Unidadnegocio.objects.all()
        proyectos_qs = Proyecto.objects.all()
        centros_qs = Centroop.objects.all()

        if empresa_id:
            unidades_qs = unidades_qs.filter(id_empresa_id=empresa_id)
            proyectos_qs = proyectos_qs.filter(id_unidad__id_empresa_id=empresa_id)
            centros_qs = centros_qs.filter(id_proyecto__id_unidad__id_empresa_id=empresa_id)
            empresas_qs = empresas_qs.filter(idempresa=empresa_id)

        if unidad_id:
            proyectos_qs = proyectos_qs.filter(id_unidad_id=unidad_id)
            centros_qs = centros_qs.filter(id_proyecto__id_unidad_id=unidad_id)
            unidades_qs = unidades_qs.filter(idunidad=unidad_id)

        if proyecto_id:
            centros_qs = centros_qs.filter(id_proyecto_id=proyecto_id)
            proyectos_qs = proyectos_qs.filter(idproyecto=proyecto_id)

        data = {
            "empresas": empresas_qs.count(),
            "unidades": unidades_qs.count(),
            "proyectos": proyectos_qs.count(),
            "centros": centros_qs.count(),
            "activos": {
                "empresas": empresas_qs.filter(estadoempresa=1).count(),
                "unidades": unidades_qs.filter(estadounidad=1).count(),
                "proyectos": proyectos_qs.filter(estadoproyecto=1).count(),
                "centros": centros_qs.filter(estadocentrop=1).count(),
            },
        }
        return Response(data)


class EmpresaCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        serializer = EpresaSerializer(data=request.data)
        if serializer.is_valid():
            empresa = serializer.save()
            return Response(
                {"message": "Empresa creada exitosamente", "empresa": EpresaSerializer(empresa).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerEmpresaView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, empresa_id):
        empresa = Epresa.objects.filter(id_empresa=empresa_id).first()
        if not empresa:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"empresa": EpresaSerializer(empresa).data})

    def put(self, request, empresa_id):
        empresa = Epresa.objects.filter(id_empresa=empresa_id).first()
        if not empresa:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        serializer = EpresaSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Empresa actualizada", "empresa": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, empresa_id):
        empresa = Epresa.objects.filter(id_empresa=empresa_id).first()
        if not empresa:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        empresa.estado_empresa = 0 if empresa.estado_empresa == 1 else 1
        empresa.save(update_fields=["estado_empresa"])

        return Response({"message": f"Estado actualizado correctamente"})


class ListaEmpresasView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        empresas = Epresa.objects.filter(estadoempresa=1)
        serializer = EpresaSerializer(empresas, many=True)
        return Response({"empresas": serializer.data})



# ============================
# UNIDAD DE NEGOCIO
# ============================
class UnidadNegocioCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = UnidadNegocioSerializer(data=request.data)
        if serializer.is_valid():
            unidad = serializer.save()
            return Response(
                {"message": "Unidad creada", "unidad_negocio": UnidadNegocioSerializer(unidad).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerUnidadNegocioView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, unidad_id):
        unidad = Unidadnegocio.objects.filter(id_unidad=unidad_id).first()
        if not unidad:
            return Response({"error": "Unidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"unidad_negocio": UnidadNegocioSerializer(unidad).data})

    def put(self, request, unidad_id):
        unidad = Unidadnegocio.objects.filter(id_unidad=unidad_id).first()
        if not unidad:
            return Response({"error": "Unidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UnidadNegocioSerializer(unidad, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Unidad actualizada", "unidad_negocio": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, unidad_id):
        unidad = Unidadnegocio.objects.filter(id_unidad=unidad_id).first()
        if not unidad:
            return Response({"error": "Unidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        unidad.estado_unidad = 0 if unidad.estado_unidad == 1 else 1
        unidad.save(update_fields=["estado_unidad"])

        return Response({"message": f"Estado actualizado correctamente"})


class ListaUnidadesNegocioView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        unidades = Unidadnegocio.objects.select_related('empresa').all()
        serializer = UnidadNegocioSerializer(unidades, many=True)
        return Response({"unidades_negocio": serializer.data})



# ============================
# PROYECTOS
# ============================
class ProyectoCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        proyecto_data = {
            "nombre_proyecto": request.data.get("nombre_proyecto"),
            "estado_proyecto": request.data.get("estado_proyecto", 1)
        }
        unidad_id = request.data.get("id_unidad")

        if not unidad_id:
            return Response({"error": "Debe especificar la unidad"}, status=status.HTTP_400_BAD_REQUEST)

        proyecto_serializer = ProyectoSerializer(data=proyecto_data)
        if not proyecto_serializer.is_valid():
            return Response(proyecto_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        proyecto = proyecto_serializer.save()

        relacion_serializer = ProyectoSerializer(
            data={"id_proyecto": proyecto.id_proyecto, "id_unidad": unidad_id}
        )
        if relacion_serializer.is_valid():
            relacion_serializer.save()

        return Response(
            {"message": "Proyecto creado", "proyecto": ProyectoSerializer(proyecto).data},
            status=status.HTTP_201_CREATED
        )


class VerProyectoView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, proyecto_id):
        proyecto = Proyecto.objects.filter(id_proyecto=proyecto_id).first()
        if not proyecto:
            return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"proyecto": ProyectoSerializer(proyecto).data})

    def put(self, request, proyecto_id):
        proyecto = Proyecto.objects.filter(id_proyecto=proyecto_id).first()
        if not proyecto:
            return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProyectoSerializer(proyecto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        nuevas_unidades = request.data.get("unidades", [])
        if nuevas_unidades:
            proyecto.objects.filter(proyecto=proyecto).delete()
            for unidad_id in nuevas_unidades:
                unidad = Unidadnegocio.objects.filter(id_unidad=unidad_id).first()
                if unidad:
                    proyecto.objects.create(proyecto=proyecto, unidad=unidad)

        return Response({"message": "Proyecto actualizado", "proyecto": ProyectoSerializer(proyecto).data})

    def patch(self, request, proyecto_id):
        proyecto = Proyecto.objects.filter(id_proyecto=proyecto_id).first()
        if not proyecto:
            return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        proyecto.estado_proyecto = 0 if proyecto.estado_proyecto == 1 else 1
        proyecto.save(update_fields=["estado_proyecto"])

        return Response({"message": "Estado actualizado"})


class ListaProyectosView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        proyectos = Proyecto.objects.filter(estado_proyecto=1)
        serializer = ProyectoSerializer(proyectos, many=True)

        filtrados = [p for p in serializer.data if p["unidades"]]

        return Response({"proyectos": filtrados})



# ============================
# CENTRO OPERATIVO
# ============================
class CentroOperativoCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        with transaction.atomic():
            serializer = CentroOpSerializer(data=request.data)
            if serializer.is_valid():
                centro = serializer.save()
                return Response(
                    {"message": "Centro operativo creado", "centro_operativo": serializer.data},
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerCentroOperativoView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, centroop_id):
        centro = Centroop.objects.filter(id_centrop=centroop_id).first()
        if not centro:
            return Response({"error": "Centro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"centro_operativo": CentroOpSerializer(centro).data})

    def put(self, request, centroop_id):
        centro = Centroop.objects.filter(id_centrop=centroop_id).first()
        if not centro:
            return Response({"error": "Centro no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CentroOpSerializer(centro, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Centro actualizado", "centro_operativo": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, centroop_id):
        centro = Centroop.objects.filter(id_centrop=centroop_id).first()
        if not centro:
            return Response({"error": "Centro no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        centro.estado_centrop = 0 if centro.estado_centrop == 1 else 1
        centro.save(update_fields=["estado_centrop"])

        return Response({"message": "Estado actualizado"})


class ListaCentrosOperativosView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        centros = Centroop.objects.filter(estado_centrop=1).select_related("id_proyecto")
        serializer = CentroOpSimpleSerializer(centros, many=True)
        return Response({"centros_operativos": serializer.data})
    
    
class CargarEstructuraView(APIView):
    def post(self, request):
        serializer = CargarEstructuraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)
