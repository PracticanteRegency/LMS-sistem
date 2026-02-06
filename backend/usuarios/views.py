import json
from django.http import JsonResponse
from rest_framework.response import Response
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from usuarios.permissions import IsSuperAdmin, IsAdminUser, IsUsuarioEspecial
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
                "estado_capacitacion": prog.capacitacion.estado,
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
    
    def patch(self, request, id=None):
        """
        Alterna el estado del colaborador (0 <-> 1). Requiere id de colaborador.
        """
        if id is None:
            return Response({"error": "Se requiere el id del colaborador"}, status=400)

        colaborador = Colaboradores.objects.filter(idcolaborador=id).first()
        if not colaborador:
            return Response({"error": "Colaborador no encontrado"}, status=404)

        # Alternar estado: si es 1 pasa a 0, si es 0 pasa a 1
        if hasattr(colaborador, 'estadocolaborador'):
            nuevo_estado = 0 if colaborador.estadocolaborador == 1 else 1
            colaborador.estadocolaborador = nuevo_estado
            colaborador.save()

            # Cambiar también el estado del usuario relacionado si existe
            usuario = Usuarios.objects.filter(idcolaboradoru=colaborador).first()
            if usuario:
                if nuevo_estado == 0:
                    usuario.estadousuario = 0
                    usuario.save()
                # Si quieres reactivar el usuario cuando el colaborador se activa, descomenta:
                # elif nuevo_estado == 1:
                #     usuario.estadousuario = 1
                #     usuario.save()

            return Response({
                "id_colaborador": colaborador.idcolaborador,
                "nuevo_estado_colaborador": colaborador.estadocolaborador,
                "nuevo_estado_usuario": usuario.estadousuario if usuario else None
            })
        else:
            return Response({"error": "El colaborador no tiene campo 'estadocolaborador'"}, status=400)



class Register(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin, IsAdminUser]

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
        

    def get(self, request, colaborador_id):
        colaborador = (
            Colaboradores.objects
            .select_related(
                'cargocolaborador',
                'nivelcolaborador',
                'regionalcolab',
                'centroop__id_proyecto__id_unidad__id_empresa'
            )
            .filter(idcolaborador=colaborador_id)
            .first()
        )
        if not colaborador:
            return Response({"error": "Colaborador no encontrado"}, status=404)

        cargo = colaborador.cargocolaborador
        nivel = colaborador.nivelcolaborador
        region = colaborador.regionalcolab
        centroop = colaborador.centroop
        proyecto = centroop.id_proyecto if centroop else None
        unidad = proyecto.id_unidad if proyecto else None
        empresa = unidad.id_empresa if unidad else None

        data = {
            "idcolaborador": colaborador.idcolaborador,
            "nombre": colaborador.nombrecolaborador,
            "apellido": colaborador.apellidocolaborador,
            "correo": colaborador.correocolaborador,
            "telefono": colaborador.telefocolaborador,
            "cargo": cargo.idcargo if cargo else None,
            "nivel": nivel.idnivel if nivel else None,
            "region": region.idregional if region else None,
            "centroop_id": centroop.idcentrop if centroop else None,
            "centroop": centroop.nombrecentrop if centroop else None,
        }
        return Response(data)
    
    def put(self, request, colaborador_id):
        colaborador = Colaboradores.objects.filter(idcolaborador=colaborador_id).first()
        if not colaborador:
            return Response({"error": "Colaborador no encontrado"}, status=404)

        data = request.data
        # Mapear campos del frontend a los del modelo
        mapeo = {
            'nombre': 'nombrecolaborador',
            'apellido': 'apellidocolaborador',
            'correo': 'correocolaborador',
            'telefono': 'telefocolaborador',
            'cargo': 'cargocolaborador_id',
            'nivel': 'nivelcolaborador_id',
            'region': 'regionalcolab_id',
            'centroop_id': 'centroop_id',
        }
        for campo_front, campo_modelo in mapeo.items():
            if campo_front in data:
                setattr(colaborador, campo_modelo, data[campo_front])

        # Si el frontend envía estadocolaborador, también actualizarlo
        if 'estadocolaborador' in data:
            colaborador.estadocolaborador = data['estadocolaborador']

        colaborador.save()
        serializer = ColaboradorListadoSerializer(colaborador)
        return Response(serializer.data)
    

class RegisterTemporal(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin, IsAdminUser, IsUsuarioEspecial]

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
    permission_classes = [IsAuthenticated, IsSuperAdmin, IsAdminUser]

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
                .filter(estadocolaborador=1)
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

        cargos = Cargo.objects.filter(estadocargo=1).order_by('nombrecargo')
        niveles = Niveles.objects.filter(estadonivel=1).order_by('nombrenivel')
        regionales = Regional.objects.filter(estadoregional=1).order_by('nombreregional')

        cargos_data = cargosSerializer(cargos, many=True).data
        niveles_data = nivelesSerializer(niveles, many=True).data
        regionales_data = regionalesSerializer(regionales, many=True).data

        return Response({
            "cargos": cargos_data,
            "niveles": niveles_data,
            "regionales": regionales_data
        })

class FiltrarUsuariosView(APIView):
    """
    Vista para filtrar usuarios por nombre o CC.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin, IsAdminUser]

    def get(self, request):
        query = request.GET.get('q', '').strip()
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 10

        base_qs = (
            Colaboradores.objects
            .exclude(estadocolaborador=3)
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
            .order_by('idcolaborador')
        )
        if query:
            base_qs = base_qs.filter(
                Q(nombrecolaborador__icontains=query) |
                Q(apellidocolaborador__icontains=query) |
                Q(cccolaborador__icontains=query)
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


class CambiarEstadoUsuarioView(APIView):
    """
    Vista para activar o desactivar un usuario.
    Solo SuperAdmin puede realizar esta acción.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, colaborador_id):
        """
        PATCH /usuarios/cambiar-estado-usuario/<colaborador_id>/
        Body: { "estado": 1 o 0 }
        
        - estado = 1: activar usuario
        - estado = 0: desactivar usuario
        """
        try:
            nuevo_estado = request.data.get('estado')
            
            if nuevo_estado is None:
                return Response(
                    {"error": "El campo 'estado' es requerido (0 o 1)"},
                    status=400
                )
            
            if nuevo_estado not in [0, 1]:
                return Response(
                    {"error": "El estado debe ser 0 (inactivo) o 1 (activo)"},
                    status=400
                )
            
            # Obtener el usuario por su colaborador
            usuario = Usuarios.objects.filter(
                idcolaboradoru__idcolaborador=colaborador_id
            ).first()
            
            if not usuario:
                return Response(
                    {"error": "Usuario no encontrado"},
                    status=404
                )
            
            usuario.estadousuario = nuevo_estado
            usuario.save()
            
            # Sincronizar estado en el modelo Colaboradores
            colaborador = getattr(usuario, 'idcolaboradoru', None)
            nuevo_estado_colaborador = None
            if colaborador:
                try:
                    colaborador.estadocolaborador = nuevo_estado
                    colaborador.save()
                    nuevo_estado_colaborador = colaborador.estadocolaborador
                except Exception:
                    nuevo_estado_colaborador = None
            
            return Response({
                "mensaje": "Estado del usuario actualizado correctamente",
                "usuario_id": usuario.id,
                "colaborador_id": usuario.idcolaboradoru.idcolaborador if getattr(usuario, 'idcolaboradoru', None) else None,
                "nuevo_estado_usuario": usuario.estadousuario,
                "nuevo_estado_colaborador": nuevo_estado_colaborador
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar estado: {str(e)}"},
                status=500
            )


class ActualizarRolUsuarioView(APIView):
    """
    Vista para cambiar el rol de un usuario.
    Solo SuperAdmin puede realizar esta acción.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, colaborador_id):
        """
        PATCH /usuarios/actualizar-rol-usuario/<colaborador_id>/
        Body: { "tipousuario": 0, 1, 2, 3 o 4 }
        
        Tipos de usuario:
        - 0: Usuario Normal/Colaborador
        - 1: Administrador
        - 2: Lectura Admin
        - 3: Usuario Especial
        - 4: Super Admin
        """
        try:
            nuevo_rol = request.data.get('tipousuario')
            
            if nuevo_rol is None:
                return Response(
                    {"error": "El campo 'tipousuario' es requerido"},
                    status=400
                )
            
            if nuevo_rol not in [0, 1, 2, 3, 4]:
                return Response(
                    {"error": "El tipousuario debe ser 0, 1, 2, 3 o 4"},
                    status=400
                )
            
            # Obtener el usuario por su colaborador
            usuario = Usuarios.objects.filter(
                idcolaboradoru__idcolaborador=colaborador_id
            ).first()
            
            if not usuario:
                return Response(
                    {"error": "Usuario no encontrado"},
                    status=404
                )
            
            rol_anterior = usuario.tipousuario
            usuario.tipousuario = nuevo_rol
            usuario.save()
            
            return Response({
                "mensaje": "Rol del usuario actualizado correctamente",
                "usuario_id": usuario.id,
                "colaborador_id": usuario.idcolaboradoru.idcolaborador,
                "rol_anterior": rol_anterior,
                "nuevo_rol": usuario.tipousuario
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar rol: {str(e)}"},
                status=500
            )


class DatosCargoView(APIView):
    """
    CRUD para gestionar Cargos.
    Solo SuperAdmin e IsUsuarioEspecial pueden manipular.
    """
    permission_classes = [IsAuthenticated]

    def check_permission(self, request):
        """Verifica si el usuario tiene permisos para manipular cargos"""
        tipo_usuario = getattr(request.user, 'tipousuario', None)
        # SuperAdmin (4) o Usuario Especial (3)
        return tipo_usuario in [3, 4]

    def get(self, request):
        """GET /usuarios/Cargo/ - Obtener todos los cargos activos"""
        try:
            cargos = Cargo.objects.filter(estadocargo=1).order_by('idcargo')
            serializer = cargosSerializer(cargos, many=True)
            return Response({
                "count": cargos.count(),
                "results": serializer.data
            }, status=200)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener cargos: {str(e)}"},
                status=500
            )

    def post(self, request):
        """POST /usuarios/Cargo/ - Crear un nuevo cargo"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden crear cargos"},
                status=403
            )
        
        try:
            nombre_cargo = request.data.get('nombrecargo')
            
            if not nombre_cargo:
                return Response(
                    {"error": "El campo 'nombrecargo' es requerido"},
                    status=400
                )
            
            # Verificar si el cargo ya existe
            if Cargo.objects.filter(nombrecargo=nombre_cargo).exists():
                return Response(
                    {"error": "El cargo ya existe"},
                    status=400
                )
            
            cargo = Cargo.objects.create(
                nombrecargo=nombre_cargo,
                estadocargo=1
            )
            
            serializer = cargosSerializer(cargo)
            return Response({
                "mensaje": "Cargo creado correctamente",
                "data": serializer.data
            }, status=201)
            
        except Exception as e:
            return Response(
                {"error": f"Error al crear cargo: {str(e)}"},
                status=500
            )

    def put(self, request):
        """PUT /usuarios/Cargo/ - Actualizar un cargo"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden actualizar cargos"},
                status=403
            )
        
        try:
            cargo_id = request.data.get('idcargo')
            nombre_cargo = request.data.get('nombrecargo')
            
            if not cargo_id:
                return Response(
                    {"error": "El campo 'idcargo' es requerido"},
                    status=400
                )
            
            if not nombre_cargo:
                return Response(
                    {"error": "El campo 'nombrecargo' es requerido"},
                    status=400
                )
            
            cargo = Cargo.objects.filter(idcargo=cargo_id).first()
            
            if not cargo:
                return Response(
                    {"error": "Cargo no encontrado"},
                    status=404
                )
            
            cargo.nombrecargo = nombre_cargo
            cargo.save()
            
            serializer = cargosSerializer(cargo)
            return Response({
                "mensaje": "Cargo actualizado correctamente",
                "data": serializer.data
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar cargo: {str(e)}"},
                status=500
            )

    def delete(self, request):
        """DELETE /usuarios/Cargo/ - Eliminar (desactivar) un cargo"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden eliminar cargos"},
                status=403
            )
        
        try:
            cargo_id = request.data.get('idcargo')
            
            if not cargo_id:
                return Response(
                    {"error": "El campo 'idcargo' es requerido"},
                    status=400
                )
            
            cargo = Cargo.objects.filter(idcargo=cargo_id).first()
            
            if not cargo:
                return Response(
                    {"error": "Cargo no encontrado"},
                    status=404
                )
            
            cargo.estadocargo = 0
            cargo.save()
            
            return Response({
                "mensaje": "Cargo desactivado correctamente",
                "cargo_id": cargo.idcargo
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al eliminar cargo: {str(e)}"},
                status=500
            )


class DatosNivelView(APIView):
    """
    CRUD para gestionar Niveles.
    Solo SuperAdmin e IsUsuarioEspecial pueden manipular.
    """
    permission_classes = [IsAuthenticated]

    def check_permission(self, request):
        """Verifica si el usuario tiene permisos para manipular niveles"""
        tipo_usuario = getattr(request.user, 'tipousuario', None)
        # SuperAdmin (4) o Usuario Especial (3)
        return tipo_usuario in [3, 4]

    def get(self, request):
        """GET /usuarios/Nivel/ - Obtener todos los niveles activos"""
        try:
            niveles = Niveles.objects.filter(estadonivel=1).order_by('idnivel')
            serializer = nivelesSerializer(niveles, many=True)
            return Response({
                "count": niveles.count(),
                "results": serializer.data
            }, status=200)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener niveles: {str(e)}"},
                status=500
            )

    def post(self, request):
        """POST /usuarios/Nivel/ - Crear un nuevo nivel"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden crear niveles"},
                status=403
            )
        
        try:
            nombre_nivel = request.data.get('nombrenivel')
            
            if not nombre_nivel:
                return Response(
                    {"error": "El campo 'nombrenivel' es requerido"},
                    status=400
                )
            
            # Verificar si el nivel ya existe
            if Niveles.objects.filter(nombrenivel=nombre_nivel).exists():
                return Response(
                    {"error": "El nivel ya existe"},
                    status=400
                )
            
            nivel = Niveles.objects.create(
                nombrenivel=nombre_nivel,
                estadonivel=1
            )
            
            serializer = nivelesSerializer(nivel)
            return Response({
                "mensaje": "Nivel creado correctamente",
                "data": serializer.data
            }, status=201)
            
        except Exception as e:
            return Response(
                {"error": f"Error al crear nivel: {str(e)}"},
                status=500
            )

    def put(self, request):
        """PUT /usuarios/Nivel/ - Actualizar un nivel"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden actualizar niveles"},
                status=403
            )
        
        try:
            nivel_id = request.data.get('idnivel')
            nombre_nivel = request.data.get('nombrenivel')
            
            if not nivel_id:
                return Response(
                    {"error": "El campo 'idnivel' es requerido"},
                    status=400
                )
            
            if not nombre_nivel:
                return Response(
                    {"error": "El campo 'nombrenivel' es requerido"},
                    status=400
                )
            
            nivel = Niveles.objects.filter(idnivel=nivel_id).first()
            
            if not nivel:
                return Response(
                    {"error": "Nivel no encontrado"},
                    status=404
                )
            
            nivel.nombrenivel = nombre_nivel
            nivel.save()
            
            serializer = nivelesSerializer(nivel)
            return Response({
                "mensaje": "Nivel actualizado correctamente",
                "data": serializer.data
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar nivel: {str(e)}"},
                status=500
            )

    def delete(self, request):
        """DELETE /usuarios/Nivel/ - Eliminar (desactivar) un nivel"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden eliminar niveles"},
                status=403
            )
        
        try:
            nivel_id = request.data.get('idnivel')
            
            if not nivel_id:
                return Response(
                    {"error": "El campo 'idnivel' es requerido"},
                    status=400
                )
            
            nivel = Niveles.objects.filter(idnivel=nivel_id).first()
            
            if not nivel:
                return Response(
                    {"error": "Nivel no encontrado"},
                    status=404
                )
            
            nivel.estadonivel = 0
            nivel.save()
            
            return Response({
                "mensaje": "Nivel desactivado correctamente",
                "nivel_id": nivel.idnivel
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al eliminar nivel: {str(e)}"},
                status=500
            )


class DatosRegionView(APIView):
    """
    CRUD para gestionar Regionales.
    Solo SuperAdmin e IsUsuarioEspecial pueden manipular.
    """
    permission_classes = [IsAuthenticated]

    def check_permission(self, request):
        """Verifica si el usuario tiene permisos para manipular regionales"""
        tipo_usuario = getattr(request.user, 'tipousuario', None)
        # SuperAdmin (4) o Usuario Especial (3)
        return tipo_usuario in [3, 4]

    def get(self, request):
        """GET /usuarios/Region/ - Obtener todas las regionales activas"""
        try:
            regionales = Regional.objects.filter(estadoregional=1).order_by('idregional')
            serializer = regionalesSerializer(regionales, many=True)
            return Response({
                "count": regionales.count(),
                "results": serializer.data
            }, status=200)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener regionales: {str(e)}"},
                status=500
            )

    def post(self, request):
        """POST /usuarios/Region/ - Crear una nueva regional"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden crear regionales"},
                status=403
            )
        
        try:
            nombre_regional = request.data.get('nombreregional')
            
            if not nombre_regional:
                return Response(
                    {"error": "El campo 'nombreregional' es requerido"},
                    status=400
                )
            
            # Verificar si la regional ya existe
            if Regional.objects.filter(nombreregional=nombre_regional).exists():
                return Response(
                    {"error": "La regional ya existe"},
                    status=400
                )
            
            regional = Regional.objects.create(
                nombreregional=nombre_regional,
                estadoregional=1
            )
            
            serializer = regionalesSerializer(regional)
            return Response({
                "mensaje": "Regional creada correctamente",
                "data": serializer.data
            }, status=201)
            
        except Exception as e:
            return Response(
                {"error": f"Error al crear regional: {str(e)}"},
                status=500
            )

    def put(self, request):
        """PUT /usuarios/Region/ - Actualizar una regional"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden actualizar regionales"},
                status=403
            )
        
        try:
            regional_id = request.data.get('idregional')
            nombre_regional = request.data.get('nombreregional')
            
            if not regional_id:
                return Response(
                    {"error": "El campo 'idregional' es requerido"},
                    status=400
                )
            
            if not nombre_regional:
                return Response(
                    {"error": "El campo 'nombreregional' es requerido"},
                    status=400
                )
            
            regional = Regional.objects.filter(idregional=regional_id).first()
            
            if not regional:
                return Response(
                    {"error": "Regional no encontrada"},
                    status=404
                )
            
            regional.nombreregional = nombre_regional
            regional.save()
            
            serializer = regionalesSerializer(regional)
            return Response({
                "mensaje": "Regional actualizada correctamente",
                "data": serializer.data
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar regional: {str(e)}"},
                status=500
            )

    def delete(self, request):
        """DELETE /usuarios/Region/ - Eliminar (desactivar) una regional"""
        if not self.check_permission(request):
            return Response(
                {"error": "Solo SuperAdmin e IsUsuarioEspecial pueden eliminar regionales"},
                status=403
            )
        
        try:
            regional_id = request.data.get('idregional')
            
            if not regional_id:
                return Response(
                    {"error": "El campo 'idregional' es requerido"},
                    status=400
                )
            
            regional = Regional.objects.filter(idregional=regional_id).first()
            
            if not regional:
                return Response(
                    {"error": "Regional no encontrada"},
                    status=404
                )
            
            regional.estadoregional = 0
            regional.save()
            
            return Response({
                "mensaje": "Regional desactivada correctamente",
                "regional_id": regional.idregional
            }, status=200)
            
        except Exception as e:
            return Response(
                {"error": f"Error al eliminar regional: {str(e)}"},
                status=500
            )