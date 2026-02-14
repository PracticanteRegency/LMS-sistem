from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from decimal import Decimal

from django.db.models import Avg, Q, Count
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from django.conf import settings
from django.utils.timezone import now
from datetime import datetime
from calendar import monthrange

from usuarios.models import Colaboradores

from usuarios.permissions import IsSuperAdmin, IsAdminUser, IsUsuarioEspecial, IsSuperUserOrAdmin

from .models import Epresa, Unidadnegocio, Proyecto, Centroop
from .serializers import (
	EpresaSerializer,
	UnidadNegocioSerializer,
	ProyectoSerializer,
	CentroOpSerializer,
	CentroOpSimpleSerializer,
	CargarEstructuraSerializer,
	JefesProyectoSerializer,
)
from rest_framework.permissions import IsAuthenticated
from capacitaciones.models import progresoCapacitaciones


# --- Analítica ---
class ProgresoEmpresarialView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):

        hoy = now()
        mes_actual = hoy.month
        anio_actual = hoy.year

        # Rango del mes actual
        inicio_mes = datetime(anio_actual, mes_actual, 1)
        ultimo_dia = monthrange(anio_actual, mes_actual)[1]
        fin_mes = datetime(anio_actual, mes_actual, ultimo_dia, 23, 59, 59)
        # Construir mapa agregado por nombre de unidad -> nombre de proyecto -> nombre de centro
        empresas = Epresa.objects.filter(estadoempresa=1)

        units_map = {}

        for empresa in empresas:
            unidades = Unidadnegocio.objects.filter(id_empresa=empresa)

            for unidad in unidades:
                unit_key = unidad.nombreunidad.strip().lower()
                if unit_key not in units_map:
                    units_map[unit_key] = {
                        "unidad": unidad.nombreunidad,
                        "tipo": "unidad",
                        "proyectos": {}
                    }

                proyectos_unidad = Proyecto.objects.filter(id_unidad=unidad)

                for proyecto in proyectos_unidad:
                    proj_key = proyecto.nombreproyecto.strip().lower()
                    proj_map = units_map[unit_key]["proyectos"]
                    if proj_key not in proj_map:
                        proj_map[proj_key] = {
                            "proyecto": proyecto.nombreproyecto,
                            "tipo": "proyecto",
                            "centros": {}
                        }

                    # Obtener centros del proyecto con promedio anotado
                    # IMPORTANTE: Filtrar solo colaboradores ACTIVOS (estadocolaborador=1)
                    centros = Centroop.objects.filter(id_proyecto=proyecto).annotate(
                        promedio_progreso=Avg(
                            'colaboradores__progresocapacitaciones__progreso',
                            filter=(
                                Q(colaboradores__progresocapacitaciones__capacitacion__fecha_inicio__lte=fin_mes) &
                                Q(colaboradores__progresocapacitaciones__capacitacion__fecha_fin__gte=inicio_mes) &
                                ~Q(colaboradores__progresocapacitaciones__capacitacion__estado__in=[0, 3]) &
                                Q(colaboradores__estadocolaborador=1)  # FILTRO: Solo colaboradores activos
                            )
                        )
                    )

                    for centro in centros:
                        centro_name = centro.nombrecentrop.strip()
                        center_key = centro_name.lower()
                        centers_map = proj_map[proj_key]["centros"]
                        if center_key not in centers_map:
                            centers_map[center_key] = {
                                "centro_op": centro.nombrecentrop,
                                "valores": []
                            }

                        promedio = centro.promedio_progreso or Decimal('0')
                        centers_map[center_key]["valores"].append(Decimal(promedio))

        # Construir la estructura final (unidades -> proyectos -> centros) con promedios agregados
        estructura = []

        for unit in units_map.values():
            proyectos_list = []
            unidad_promedios = []

            for proj in unit["proyectos"].values():
                centros_list = []
                proyecto_centros_prom = []

                for centro in proj["centros"].values():
                    vals = centro.get("valores", [])
                    centro_avg = (sum(vals) / len(vals)) if vals else Decimal('0')
                    centros_list.append({
                        "centro_op": centro["centro_op"],
                        "porcentaje": float(round(centro_avg, 2)),
                        "tipo": "centro_op"
                    })
                    proyecto_centros_prom.append(centro_avg)

                proyecto_avg = (sum(proyecto_centros_prom) / len(proyecto_centros_prom)) if proyecto_centros_prom else Decimal('0')
                proyectos_list.append({
                    "proyecto": proj["proyecto"],
                    "tipo": "proyecto",
                    "porcentaje": float(round(proyecto_avg, 2)),
                    "centrosop": centros_list
                })
                unidad_promedios.append(proyecto_avg)

            unidad_avg = (sum(unidad_promedios) / len(unidad_promedios)) if unidad_promedios else Decimal('0')
            estructura.append({
                "unidad": unit["unidad"],
                "tipo": "unidad",
                "porcentaje": float(round(unidad_avg, 2)),
                "proyectos": proyectos_list
            })

        return Response({"estructura": estructura}, status=status.HTTP_200_OK)
    
    
class ProgresoEmpresarialFiltradoView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin, IsAdminUser]
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
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

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
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def get(self, request, pk):
        empresa = Epresa.objects.filter(idempresa=pk).first()
        if not empresa:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"empresa": EpresaSerializer(empresa).data})

    def put(self, request, pk):
        empresa = Epresa.objects.filter(idempresa=pk).first()
        if not empresa:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        serializer = EpresaSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Empresa actualizada", "empresa": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        empresa = Epresa.objects.filter(idempresa=pk).first()
        if not empresa:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        empresa.estadoempresa = 0 if empresa.estadoempresa == 1 else 1
        empresa.save(update_fields=["estadoempresa"])

        return Response({"message": f"Estado actualizado correctamente"})


class ListaEmpresasView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrAdmin | IsUsuarioEspecial]

    def get(self, request):
        empresas = Epresa.objects.filter(estadoempresa=1)
        serializer = EpresaSerializer(empresas, many=True)
        return Response({"empresas": serializer.data})



# ============================
# UNIDAD DE NEGOCIO
# ============================
class UnidadNegocioCreateView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

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
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def get(self, request, pk):
        unidad = Unidadnegocio.objects.filter(idunidad=pk).first()
        if not unidad:
            return Response({"error": "Unidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"unidad_negocio": UnidadNegocioSerializer(unidad).data})

    def put(self, request, pk):
        unidad = Unidadnegocio.objects.filter(idunidad=pk).first()
        if not unidad:
            return Response({"error": "Unidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UnidadNegocioSerializer(unidad, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Unidad actualizada", "unidad_negocio": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        unidad = Unidadnegocio.objects.filter(idunidad=pk).first()
        if not unidad:
            return Response({"error": "Unidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        unidad.estadounidad = 0 if unidad.estadounidad == 1 else 1
        unidad.save(update_fields=["estadounidad"])

        return Response({"message": f"Estado actualizado correctamente"})


class ListaUnidadesNegocioView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial, IsAdminUser]

    def get(self, request):
        unidades = Unidadnegocio.objects.select_related('id_empresa').all()
        serializer = UnidadNegocioSerializer(unidades, many=True)
        return Response({"unidades_negocio": serializer.data})



# ============================
# PROYECTOS
# ============================
class ProyectoCreateView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def post(self, request):
        unidad_id = request.data.get("id_unidad")

        if not unidad_id:
            return Response({"error": "Debe especificar la unidad"}, status=status.HTTP_400_BAD_REQUEST)

        unidad = Unidadnegocio.objects.filter(idunidad=unidad_id).first()
        if not unidad:
            return Response({"error": "Unidad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        proyecto_data = request.data.copy()
        proyecto_data['id_unidad'] = unidad_id
        
        serializer = ProyectoSerializer(data=proyecto_data)
        if serializer.is_valid():
            proyecto = serializer.save()
            return Response(
                {"message": "Proyecto creado", "proyecto": ProyectoSerializer(proyecto).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerProyectoView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def get(self, request, pk):
        proyecto = Proyecto.objects.filter(idproyecto=pk).first()
        if not proyecto:
            return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"proyecto": ProyectoSerializer(proyecto).data})

    def put(self, request, pk):
        proyecto = Proyecto.objects.filter(idproyecto=pk).first()
        if not proyecto:
            return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProyectoSerializer(proyecto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Proyecto actualizado", "proyecto": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        proyecto = Proyecto.objects.filter(idproyecto=pk).first()
        if not proyecto:
            return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        proyecto.estadoproyecto = 0 if proyecto.estadoproyecto == 1 else 1
        proyecto.save(update_fields=["estadoproyecto"])

        return Response({"message": "Estado actualizado"})


class ListaProyectosView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def get(self, request):
        proyectos = Proyecto.objects.filter(estadoproyecto=1)
        serializer = ProyectoSerializer(proyectos, many=True)
        return Response({"proyectos": serializer.data})


class JefesProyectoView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def get(self, request, proyecto_id):
        """Obtener el jefe de un proyecto"""
        try:
            proyecto = Proyecto.objects.filter(idproyecto=proyecto_id).first()
            if not proyecto:
                return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            if proyecto.idcolaborador:
                colaborador = proyecto.idcolaborador
                return Response({
                    "jefe_proyecto": {
                        "idcolaborador": colaborador.idcolaborador,
                        "nombre": colaborador.nombrecolaborador,
                        "apellido": colaborador.apellidocolaborador,
                        "cedula": colaborador.cccolaborador,
                        "correo": colaborador.correocolaborador
                    }
                })
            
            return Response({"jefe_proyecto": None})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, proyecto_id):
        """Asignar un jefe al proyecto"""
        try:
            proyecto = Proyecto.objects.filter(idproyecto=proyecto_id).first()
            if not proyecto:
                return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            colaborador_id = request.data.get('idcolaborador')
            if not colaborador_id:
                return Response({"error": "Debe especificar un colaborador"}, status=status.HTTP_400_BAD_REQUEST)
            
            colaborador = Colaboradores.objects.filter(idcolaborador=colaborador_id).first()
            if not colaborador:
                return Response({"error": "Colaborador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            proyecto.idcolaborador = colaborador
            proyecto.save()
            
            return Response({
                "message": "Jefe de proyecto asignado correctamente",
                "jefe_proyecto": {
                    "idcolaborador": colaborador.idcolaborador,
                    "nombre": colaborador.nombrecolaborador,
                    "apellido": colaborador.apellidocolaborador,
                    "cedula": colaborador.cccolaborador,
                    "correo": colaborador.correocolaborador
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, proyecto_id):
        """Actualizar el jefe del proyecto"""
        try:
            proyecto = Proyecto.objects.filter(idproyecto=proyecto_id).first()
            if not proyecto:
                return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            colaborador_id = request.data.get('idcolaborador')
            if not colaborador_id:
                return Response({"error": "Debe especificar un colaborador"}, status=status.HTTP_400_BAD_REQUEST)
            
            colaborador = Colaboradores.objects.filter(idcolaborador=colaborador_id).first()
            if not colaborador:
                return Response({"error": "Colaborador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            proyecto.idcolaborador = colaborador
            proyecto.save()
            
            return Response({
                "message": "Jefe de proyecto actualizado correctamente",
                "jefe_proyecto": {
                    "idcolaborador": colaborador.idcolaborador,
                    "nombre": colaborador.nombrecolaborador,
                    "apellido": colaborador.apellidocolaborador,
                    "cedula": colaborador.cccolaborador,
                    "correo": colaborador.correocolaborador
                }
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, proyecto_id):
        """Remover el jefe del proyecto"""
        try:
            proyecto = Proyecto.objects.filter(idproyecto=proyecto_id).first()
            if not proyecto:
                return Response({"error": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
            proyecto.idcolaborador = None
            proyecto.save()
            
            return Response({"message": "Jefe del proyecto removido correctamente"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# ============================
# CENTRO OPERATIVO
# ============================
class CentroOperativoCreateView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

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
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def get(self, request, pk):
        centro = Centroop.objects.filter(idcentrop=pk).first()
        if not centro:
            return Response({"error": "Centro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"centro_operativo": CentroOpSerializer(centro).data})

    def put(self, request, pk):
        centro = Centroop.objects.filter(idcentrop=pk).first()
        if not centro:
            return Response({"error": "Centro no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CentroOpSerializer(centro, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Centro actualizado", "centro_operativo": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        centro = Centroop.objects.filter(idcentrop=pk).first()
        if not centro:
            return Response({"error": "Centro no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        centro.estadocentrop = 0 if centro.estadocentrop == 1 else 1
        centro.save(update_fields=["estadocentrop"])

        return Response({"message": "Estado actualizado"})


class ListaCentrosOperativosView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def get(self, request):
        centros = Centroop.objects.filter(estadocentrop=1).select_related("id_proyecto")
        serializer = CentroOpSimpleSerializer(centros, many=True)
        return Response({"centros_operativos": serializer.data})
    
    
class CargarEstructuraView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial]

    def post(self, request):
        serializer = CargarEstructuraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)

