import json
from django.http import JsonResponse
from rest_framework.response import Response
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from usuarios.permissions import IsSuperAdmin, IsUsuarioEspecial
from usuarios.models import Colaboradores, Usuarios, Cargo, Niveles, Regional
from capacitaciones.models import Capacitaciones, progresoCapacitaciones, Modulos, Lecciones, progresolecciones
from capacitaciones.serializers import CapacitacionProgresoSerializer
from usuarios.serializers import ColaboradorListadoSerializer, cargosSerializer, nivelesSerializer, regionalesSerializer
from django.db.models import Count, Q, Prefetch, OuterRef, Subquery, IntegerField
from django.db.models.functions import Coalesce


class Perfil(APIView):
    """
    Vista de perfil del colaborador con sus capacitaciones.
    
    Optimización:
    - Usa annotate() para calcular totales de lecciones en DB
    - Elimina queries N+1 en el loop de capacitaciones
    - Precarga relaciones con select_related
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        # Si viene un id en la ruta, usar ese colaborador; de lo contrario, el del token
        if id is not None:
            colaborador = Colaboradores.objects.select_related(
                'centroop__id_proyecto__id_unidad__id_empresa',
                'nivelcolaborador',
                'regionalcolab',
                'cargocolaborador'
            ).filter(idcolaborador=id).first()
        else:
            colaborador = request.user.idcolaboradoru
            if colaborador:
                # Recargar con relaciones
                colaborador = Colaboradores.objects.select_related(
                    'centroop__id_proyecto__id_unidad__id_empresa',
                    'nivelcolaborador',
                    'regionalcolab',
                    'cargocolaborador'
                ).filter(idcolaborador=colaborador.idcolaborador).first()

        if not colaborador:
            return Response(
                {"error": "El usuario no tiene colaborador asociado"},
                status=400
            )

        # Subquery para contar lecciones completadas por capacitación
        lecciones_completadas_subq = progresolecciones.objects.filter(
            idcolaborador=colaborador,
            idleccion__idmodulo__idcapacitacion=OuterRef('capacitacion_id'),
            completada=1
        ).values('idleccion__idmodulo__idcapacitacion').annotate(
            count=Count('id_progreso')
        ).values('count')

        progresos = (
            progresoCapacitaciones.objects
            .filter(colaborador=colaborador)
            .exclude(capacitacion__estado=3)
            .select_related('capacitacion')
            .annotate(
                total_lecciones=Count(
                    'capacitacion__modulos__lecciones',
                    distinct=True
                ),
                lecciones_completadas=Coalesce(
                    Subquery(lecciones_completadas_subq, output_field=IntegerField()),
                    0
                )
            )
        )

        capacitaciones_totales = progresos.count()
        capacitaciones_completadas = progresos.filter(completada=1).count()

        # Construir datos de capacitaciones sin queries adicionales
        capacitaciones_data = [
            {
                "id_capacitacion": prog.capacitacion.id,
                "nombre_capacitacion": prog.capacitacion.titulo,
                "completada": bool(prog.completada),
                "progreso": float(prog.progreso) if prog.progreso is not None else 0.0,
                "lecciones_completadas": prog.lecciones_completadas,
                "total_lecciones": prog.total_lecciones,
                "fecha_completacion": prog.fecha_completada.isoformat() if getattr(prog, 'fecha_completada', None) else None
            }
            for prog in progresos
        ]

        # Acceder a relaciones precargadas
        centro = getattr(colaborador, 'centroop', None)
        proyecto = getattr(centro, 'id_proyecto', None) if centro else None
        unidad = getattr(proyecto, 'id_unidad', None) if proyecto else None
        empresa = getattr(unidad, 'id_empresa', None) if unidad else None

        data = {
            "id_colaborador": colaborador.idcolaborador,
            "nombre_colaborador": colaborador.nombrecolaborador,
            "apellido_colaborador": colaborador.apellidocolaborador,
            "correo_colaborador": colaborador.correocolaborador,
            "telefo_colaborador": colaborador.telefocolaborador,

            "nombre_centroOP": getattr(centro, 'nombrecentrop', None),
            "nombre_empresa": getattr(empresa, 'nombre_empresa', None),
            "nombre_nivel": getattr(colaborador.nivelcolaborador, 'nombrenivel', None) if colaborador.nivelcolaborador_id else None,
            "nombre_regional": getattr(colaborador.regionalcolab, 'nombreregional', None) if colaborador.regionalcolab_id else None,
            "nombre_cargo": getattr(colaborador.cargocolaborador, 'nombrecargo', None) if colaborador.cargocolaborador_id else None,
            "nombre_proyecto": getattr(proyecto, 'nombreproyecto', None) if proyecto else None,
            "nombre_unidad": getattr(unidad, 'nombreunidad', None) if unidad else None,

            "capacitaciones_totales": capacitaciones_totales,
            "capacitaciones_completadas": capacitaciones_completadas,
            "capacitaciones": capacitaciones_data
        }

        return Response(data)



class Register(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin, IsUsuarioEspecial]

    def post(self, request, *args, **kwargs):

        payload = request.data if hasattr(request, 'data') else None
        if not payload:
            try:
                payload = json.loads(request.body.decode('utf-8'))
            except Exception:
                return JsonResponse({'error': 'JSON inválido'}, status=400)

        # 'is_staff' no es requerido para RegisterTemporal; se ignorará y se usará 0
        required_root = ['usuario', 'password', 'idcolaborador']
        if any(key not in payload for key in required_root):
            return JsonResponse({'error': 'Faltan campos requeridos'}, status=400)

        colab_data = payload.get('idcolaborador') or {}
        required_colab = [
            'cc_colaborador', 'nombre_colaborador', 'apellido_colaborador',
            'cargo_colaborador', 'correo_colaborador', 'nivel_colaborador',
            'regional_colab', 'centroOP'
        ]
        if any(key not in colab_data for key in required_colab):
            return JsonResponse({'error': 'Faltan datos del colaborador'}, status=400)

        try:
            colaborador = Colaboradores.objects.create(
                cccolaborador=colab_data['cc_colaborador'],
                nombrecolaborador=colab_data['nombre_colaborador'],
                apellidocolaborador=colab_data['apellido_colaborador'],
                cargocolaborador_id=colab_data['cargo_colaborador'],
                correocolaborador=colab_data.get('correo_colaborador', ''),
                telefocolaborador=colab_data.get('telefo_colaborador', ''),
                nivelcolaborador_id=colab_data['nivel_colaborador'],
                regionalcolab_id=colab_data['regional_colab'],
                centroop_id=colab_data['centroOP'],
            )

            user = Usuarios(
                usuario=payload['usuario'],
                tipousuario=int(payload['is_staff']),
                idcolaboradoru=colaborador,
                estadousuario=1,
            )
            user.set_password(payload['password'])
            user.save()

            return JsonResponse({
                'mensaje': 'Usuario creado',
                'usuario_id': user.id,
                'colaborador_id': colaborador.idcolaborador,
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

class RegisterTemporal(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        payload = request.data if hasattr(request, 'data') else None
        # Normalizar payload: si viene vacío, intentar parsear body
        if not payload:
            try:
                payload = json.loads(request.body.decode('utf-8'))
            except Exception:
                return JsonResponse({'error': 'JSON inválido'}, status=400)

        # 'is_staff' no es requerido para RegisterTemporal; se ignorará y se usará 0
        required_root = ['usuario', 'password', 'idcolaborador']

        # Si `idcolaborador` llegó como JSON string (p.e. multipart/form-data), intentar parsearlo
        if isinstance(payload.get('idcolaborador'), str):
            try:
                payload['idcolaborador'] = json.loads(payload['idcolaborador'])
            except Exception:
                pass

        if any(key not in payload for key in required_root):
            try:
                print('RegisterTemporal - payload keys:', list(payload.keys()))
            except Exception:
                pass
            return JsonResponse({'error': 'Faltan campos requeridos'}, status=400)

        colab_data = payload.get('idcolaborador') or {}
        required_colab_min = [
            'cc_colaborador', 'nombre_colaborador', 'apellido_colaborador'
        ]
        if any(key not in colab_data for key in required_colab_min):
            return JsonResponse({'error': 'Faltan datos mínimos del colaborador'}, status=400)

        try:
            colaborador = Colaboradores.objects.create(
                cccolaborador=colab_data['cc_colaborador'],
                nombrecolaborador=colab_data['nombre_colaborador'],
                apellidocolaborador=colab_data['apellido_colaborador'],
                cargocolaborador_id= 118,
                correocolaborador=colab_data.get('correo_colaborador', ''),
                telefocolaborador=colab_data.get('telefo_colaborador', ''),
                nivelcolaborador_id=5,
                regionalcolab_id=1,
                centroop_id=1,
            )

            user = Usuarios(
                usuario=payload['usuario'],
                tipousuario=0,
                idcolaboradoru=colaborador,
                estadousuario=1,
            )
            user.set_password(payload['password'])
            user.save()

            return JsonResponse({
                'mensaje': 'Usuario temporal creado',
                'usuario_id': user.id,
                'colaborador_id': colaborador.idcolaborador,
            }, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

class ListaUsuarios(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            if page < 1:
                page = 1
            if page_size < 1 or page_size > 100:
                page_size = 10

            search = request.GET.get('search', '').strip()

            base_qs = (
                Colaboradores.objects
                .select_related('cargocolaborador')
                .annotate(
                    total_capacitaciones=Count(
                        'progresocapacitaciones',
                        filter=Q(progresocapacitaciones__capacitacion__estado__in=[0, 1]),
                        distinct=True
                    ),
                    completadas=Count(
                        'progresocapacitaciones',
                        filter=Q(
                            progresocapacitaciones__capacitacion__estado__in=[0, 1],
                            progresocapacitaciones__completada=1
                        ),
                        distinct=True
                    ),
                )
                .prefetch_related(
                    Prefetch(
                        'progresocapacitaciones_set',
                        queryset=(
                            progresoCapacitaciones.objects
                            .filter(capacitacion__estado__in=[0, 1])
                            .select_related('capacitacion')
                        ),
                        to_attr='progresos_activos'
                    ),
                    Prefetch(
                        'progresocapacitaciones_set',
                        queryset=(
                            progresoCapacitaciones.objects
                            .filter(capacitacion__estado__in=[0, 1], completada=1)
                            .select_related('capacitacion')
                        ),
                        to_attr='progresos_activos_completados'
                    ),
                )
                .order_by('idcolaborador')
            )

            if search:
                base_qs = base_qs.filter(
                    Q(nombrecolaborador__icontains=search) |
                    Q(apellidocolaborador__icontains=search) |
                    Q(cccolaborador__icontains=search)
                )

            total = base_qs.count()
            start = (page - 1) * page_size
            end = start + page_size
            items = list(base_qs[start:end])

            results = ColaboradorListadoSerializer(items, many=True).data

            response = {
                'count': total,
                'page': page,
                'page_size': page_size,
                'results': results,
            }
            return Response(response)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
 

class PerfilCapacitacionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, colaborador_id=None, capacitacion_id=None):

        colaborador = Colaboradores.objects.filter(
            idcolaborador=colaborador_id
        ).first()

        if not colaborador:
            return Response({"error": "Colaborador no encontrado"}, status=404)

        capacitacion = Capacitaciones.objects.filter(pk=capacitacion_id).first()
        if not capacitacion:
            return Response({"error": "Capacitación no encontrada"}, status=404)

        # Serializar detalle completo de la capacitación con progreso y estructura
        serializer = CapacitacionProgresoSerializer(
            capacitacion,
            context={"colaborador": colaborador}
        )
        return Response(serializer.data)
    
class CargoNivelRegionalView(APIView):
    """
    Vista para obtener listas de Cargo, Niveles y Regionales.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):

        cargos = Cargo.objects.filter(estadocargo=1)
        niveles = Niveles.objects.filter(estadonivel=1)
        regionales = Regional.objects.filter(estadoregional=1)

        cargos_data = cargosSerializer(cargos, many=True).data
        niveles_data = nivelesSerializer(niveles, many=True).data
        regionales_data = regionalesSerializer(regionales, many=True).data

        return Response({
            "cargos": cargos_data,
            "niveles": niveles_data,
            "regionales": regionales_data
        })