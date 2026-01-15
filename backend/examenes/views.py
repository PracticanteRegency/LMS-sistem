from django.shortcuts import get_object_or_404
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter
from django.http import HttpResponse
from datetime import datetime, timedelta
from django.utils import timezone
import io
import uuid
import csv
import logging
from django.db.models import F, Prefetch

from usuarios.models import Cargo
from usuarios.permissions import IsUsuarioEspecial, IsSuperAdmin
from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop

from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings

from .models import ExamenesCargo, CorreoExamenEnviado, RegistroExamenes, Examen, ExamenTrabajador

# Tipos de examen válidos
TIPOS_EXAMEN_VALIDOS = ['INGRESO', 'PERIODICO', 'RETIRO', 'ESPECIAL', 'POST_INCAPACIDAD']

from .serializers import (
    EnviarCorreoSerializer,
    EmpresaConCargosSerializer,
    ReporteCorreoSerializer,
    DetalleCorreoSerializer,
    EnviarCorreoMasivoSerializer,
    ActualizarEstadoTrabajadorSerializer,
    ActualizarEstadoExamenesSerializer,
)


class ReporteCorreosEnviadosView(APIView):
    """
    Vista para obtener reporte de correos enviados.
    Retorna lista paginada de correos con información resumida.

    GET: Lista de correos enviados ordenados por fecha descendente.
    """
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]

    def get(self, request):
        """Obtiene lista paginada de correos enviados (con cache)."""
        page = request.query_params.get('page', '1')
        page_size = request.query_params.get('page_size', '25')
        cache_key = f"reporte_correos_page={page}_size={page_size}"

        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK, headers={'X-Cache': 'HIT'})

        # Obtener correos con datos relacionados optimizados
        correos = self._get_correos_queryset()

        # Aplicar paginación
        paginated_data = self._paginate_correos(correos, request)

        if paginated_data:
            # Guardar en cache y marcar MISS
            cache.set(cache_key, paginated_data.data, timeout=300)
            paginated_data['X-Cache'] = 'MISS'
            return paginated_data

        # Fallback sin paginación
        serializer = ReporteCorreoSerializer(correos, many=True)
        data = serializer.data
        cache.set(cache_key, data, timeout=300)
        return Response(data, status=status.HTTP_200_OK, headers={'X-Cache': 'MISS'})

    def _get_correos_queryset(self):
        """Construye queryset optimizado de correos."""
        return CorreoExamenEnviado.objects.select_related(
            'enviado_por'
        ).order_by('-fecha_envio')

    def _paginate_correos(self, correos, request):
        """Aplica paginación al queryset de correos."""
        paginator = PageNumberPagination()
        paginator.page_size = 25
        paginator.page_size_query_param = 'page_size'
        paginator.max_page_size = 100
        paginated_correos = paginator.paginate_queryset(
            correos, request, view=self)

        if paginated_correos is not None:
            serializer = ReporteCorreoSerializer(paginated_correos, many=True)
            return paginator.get_paginated_response(serializer.data)

        return None


class DetalleCorreoEnviadoView(APIView):
    """
    Vista para obtener detalles completos de un correo enviado.

    GET: Retorna información detallada de un envío específico.
    """
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]

    def get(self, request, correo_id):
        """Retorna metadata del correo y el listado de trabajadores (RegistroExamenes) asociados, con paginación estándar (count, next, previous, results) y cache."""
        correo = get_object_or_404(
            CorreoExamenEnviado.objects.select_related('enviado_por'),
            id=correo_id
        )

        # Obtener trabajadores del correo
        trabajadores = RegistroExamenes.objects.filter(
            correo_lote=correo
        ).select_related('empresa', 'cargo').order_by('-fecha_registro')

        # Cache por correo_id + paginación
        page = request.query_params.get('page', '1')
        page_size = request.query_params.get('page_size', '25')
        cache_key = f"detalle_correo={correo_id}_page={page}_size={page_size}"

        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK, headers={'X-Cache': 'HIT'})

        # Paginar resultados
        paginator = PageNumberPagination()
        paginator.page_size = 25
        paginator.page_size_query_param = 'page_size'
        paginator.max_page_size = 100
        paginated_trabajadores = paginator.paginate_queryset(trabajadores, request, view=self)

        from .serializers import ListarTrabajadoresCorreoSerializer

        if paginated_trabajadores is not None:
            # Serializar página actual
            serializer = ListarTrabajadoresCorreoSerializer(paginated_trabajadores, many=True)
            # Respuesta estándar de DRF: count, next, previous, results
            paginated_response = paginator.get_paginated_response(serializer.data)
            # Agregar metadata del correo
            paginated_response.data.update({
                "correo_id": correo.id,
                "uuid_correo": getattr(correo, 'uuid_correo', None),
                "asunto": correo.asunto,
                "fecha_envio": getattr(correo, 'fecha_envio', None),
                "total_trabajadores": trabajadores.count()
            })
            paginated_response['X-Cache'] = 'MISS'
            cache.set(cache_key, paginated_response.data, timeout=300)
            return paginated_response

        # Fallback sin paginación (poco probable): devolver estructura similar
        serializer = ListarTrabajadoresCorreoSerializer(trabajadores, many=True)
        data = {
            "count": len(serializer.data),
            "next": None,
            "previous": None,
            "results": serializer.data,
            "correo_id": correo.id,
            "uuid_correo": getattr(correo, 'uuid_correo', None),
            "asunto": correo.asunto,
            "fecha_envio": getattr(correo, 'fecha_envio', None),
            "total_trabajadores": trabajadores.count()
        }
        cache.set(cache_key, data, timeout=300)
        return Response(data, status=status.HTTP_200_OK, headers={'X-Cache': 'MISS'})


class EnviarCorreoView(APIView):
    """
    Vista para enviar correo individual de convocatoria a exámenes médicos.

    POST: Envía correo a un trabajador con los exámenes seleccionados por el frontend.
    
    JSON esperado:
    {
        "nombre_trabajador": "Juan Pérez",
        "documento_trabajador": "123456789",
        "correo_destino": "juan@email.com",
        "centro_id": 5,
        "cargo_id": 10,
        "tipo_examen": "INGRESO",
        "examenes_ids": [1, 4, 7, 12]
    }
    
    Flujo:
    1. Valida datos y deriva empresa desde centro
    2. Crea CorreoExamenEnviado (lote)
    3. Crea RegistroExamenes (trabajador)
    4. Crea ExamenTrabajador por cada examen (relación M2M)
    5. Crea RegistroExamenesEnviados por cada examen (trazabilidad)
    6. Envía el correo
    """
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]

    def post(self, request):
        """Procesa y envía correo individual de exámenes médicos."""
        # Log raw request for debugging (verificar payload enviado por frontend)
        logger = logging.getLogger(__name__)
        try:
            logger.info(f"Raw request.body: {request.body}")
        except Exception:
            logger.info("Raw request.body: <unavailable>")
        logger.info(f"Raw request.data (parsed): {request.data}")

        # Validar datos de entrada
        serializer = EnviarCorreoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        # Log payload para debugging (verificar si 'ciudad' llega)
        logger = logging.getLogger(__name__)
        logger.info(f"EnviarCorreo payload validated: {data}")

        # Obtener colaborador autenticado
        enviado_por = self._get_colaborador(request)

        # Forzar destinatarios fijos para este endpoint
        correos_destino_fixed = (
            "practicante.desarrollogh@regency.com.co,"
            #"operativo@servicompetentes.com,"
            #"administrativo@servicompetentes.com"
        )
        correos_list_fixed = [e.strip() for e in correos_destino_fixed.split(',') if e.strip()]
        # Sobrescribir el campo de destino para que quede registrado en BD
        data['correo_destino'] = correos_destino_fixed

        # Obtener centro y derivar empresa
        centro = get_object_or_404(
            Centroop.objects.select_related('id_proyecto__id_unidad__id_empresa'),
            idcentrop=data['centro_id']
        )
        empresa = centro.id_proyecto.id_unidad.id_empresa
        cargo = get_object_or_404(Cargo, idcargo=data['cargo_id'])
        tipo_examen = data['tipo_examen']

        # Validar y obtener exámenes desde IDs enviados por frontend
        examenes = self._get_examenes_por_ids(data['examenes_ids'])
        if not examenes:
            return Response(
                {"error": "No se encontraron exámenes válidos con los IDs proporcionados"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear registros en BD (CorreoExamenEnviado, RegistroExamenes, ExamenTrabajador, RegistroExamenesEnviados)
        correo_obj, registro_trabajador = self._crear_registros_completos(
            enviado_por=enviado_por,
            data=data,
            empresa=empresa,
            cargo=cargo,
            centro=centro,
            tipo_examen=tipo_examen,
            examenes=examenes,
            colaborador=enviado_por
        )

        # Enviar correo a la lista fija (pasamos ciudad para trazabilidad en la respuesta)
        resultado = self._enviar_correo(
            correo_obj,
            correos_list_fixed,
            data['nombre_trabajador'],
            registro_trabajador,
            ciudad=data.get('ciudad')
        )

        return resultado

    def _get_colaborador(self, request):
        """Obtiene el colaborador del usuario autenticado."""
        colaborador = getattr(request.user, 'idcolaboradoru', None)
        if colaborador is None:
            colaborador = getattr(request.user, 'id_colaboradoru', None)
        return colaborador

    def _get_examenes_por_ids(self, examenes_ids):
        """Obtiene exámenes activos por lista de IDs."""
        return list(Examen.objects.filter(
            id_examen__in=examenes_ids,
            activo=True
        ))

    def _crear_registros_completos(
            self, enviado_por, data, empresa, cargo, centro, tipo_examen, examenes, colaborador=None):
        """
        Crea todos los registros necesarios en la base de datos:
        1. CorreoExamenEnviado (lote)
        2. RegistroExamenes (trabajador)
        3. ExamenTrabajador (relación M2M por cada examen)
        4. RegistroExamenesEnviados (trazabilidad por cada examen)
        """
        asunto = f"Exámenes médicos – {data['nombre_trabajador']} ({tipo_examen})"

        # 1. Crear CorreoExamenEnviado (genera UUID automáticamente)
        correo_obj = CorreoExamenEnviado(
            enviado_por=enviado_por,
            asunto=asunto,
            cuerpo_correo="",
            correos_destino=data['correo_destino'],
            tipo_examen=tipo_examen,
            enviado_correctamente=False
        )
        correo_obj.save()

        # 2. Crear RegistroExamenes (trabajador)
        # Campo examenes_asignados se llena con nombres para compatibilidad
        nombres_examenes = ", ".join([e.nombre for e in examenes])
        registro_trabajador = RegistroExamenes.objects.create(
            correo_lote=correo_obj,
            nombre_trabajador=data['nombre_trabajador'],
            documento_trabajador=data['documento_trabajador'],
            ciudad=data.get('ciudad'),
            empresa=empresa,
            cargo=cargo,
            centro=centro,
            tipo_examen=tipo_examen,
            examenes_asignados=nombres_examenes,
            estado_trabajador=0  # Pendiente
        )

        # 3. Crear ExamenTrabajador por cada examen (relación M2M - bulk_create)
        examenes_trabajador = [
            ExamenTrabajador(
                registro_examen=registro_trabajador,
                examen=examen
            )
            for examen in examenes
        ]
        ExamenTrabajador.objects.bulk_create(examenes_trabajador)

        # Nota: No creamos ni sincronizamos `RegistroExamenesEnviados` aquí.
        # Usamos `ExamenTrabajador` para representar los exámenes asignados
        # y `RegistroExamenes.estado_trabajador` como la fuente de verdad
        # del estado del trabajador (Pendiente/Completado).

        # 5. Construir cuerpo del correo
        cuerpo_correo = self._construir_cuerpo_correo(
            data=data,
            cargo=cargo,
            empresa=empresa,
            centro=centro,
            tipo_examen=tipo_examen,
            examenes=examenes,
            uuid_correo=correo_obj.uuid_correo,
            uuid_trabajador=registro_trabajador.uuid_trabajador,
            fecha_envio=correo_obj.fecha_envio,
            colaborador=colaborador
        )

        # 6. Actualizar correo con cuerpo completo
        correo_obj.cuerpo_correo = cuerpo_correo
        correo_obj.save()

        return correo_obj, registro_trabajador

    def _construir_cuerpo_correo(
            self, data, cargo, empresa, centro, tipo_examen, examenes, uuid_correo, uuid_trabajador, fecha_envio, colaborador=None):
        """Construye el cuerpo del correo con toda la información incluyendo tipo de examen y datos del colaborador."""
        # Construir lista de exámenes
        lista_examenes = "\n".join([f"- {e.nombre}" for e in examenes])

        # Mapeo de tipos a nombres legibles
        tipos_legibles = {
            'INGRESO': 'Examen de Ingreso',
            'PERIODICO': 'Examen Periódico',
            'RETIRO': 'Examen de Retiro',
            'ESPECIAL': 'Examen Especial',
            'POST_INCAPACIDAD': 'Examen Post-Incapacidad'
        }
        tipo_legible = tipos_legibles.get(tipo_examen, tipo_examen)

        # Resolver nombre y correo del colaborador (soporta instancia Colaboradores o valor simple)
        nombre_colaborador = None
        correo_colaborador = None
        try:
            if colaborador is not None:
                nombre_colaborador = getattr(colaborador, 'nombrecolaborador', None) or getattr(colaborador, 'nombre', None)
                correo_colaborador = getattr(colaborador, 'correocolaborador', None) or getattr(colaborador, 'correo', None) or getattr(colaborador, 'email', None)
        except Exception:
            nombre_colaborador = None
            correo_colaborador = None

        if not nombre_colaborador:
            nombre_colaborador = data.get('nombre_trabajador') or 'No disponible'
        if not correo_colaborador:
            correo_colaborador = 'No disponible'

        cuerpo = (
            f"Cordial Saludo.\n\n"
            f"Se han programado los siguientes exámenes médicos para el trabajador:\n\n"
            f"Nombre: {data['nombre_trabajador']}\n"
            f"Documento: {data['documento_trabajador']}\n"
            f"Ciudad: {data.get('ciudad', 'No disponible')}\n"
            f"Cargo: {cargo.nombrecargo}\n"
            f"Empresa: {empresa.nombre_empresa}\n"
            f"Centro Operativo: {getattr(centro, 'nombrecentrop', str(centro))}\n"
            f"Tipo de Examen: {tipo_legible}\n\n"
            f"Exámenes requeridos:\n{lista_examenes}\n\n"
            f"---\n"
            f"ID de Lote: {uuid_correo}\n"
            f"ID de Trabajador: {uuid_trabajador}\n"
            f"Fecha de Envío: {fecha_envio.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Solicitante: {nombre_colaborador}\n"
            f"Correo del solicitante: {correo_colaborador}"
        )
        return cuerpo

    def _enviar_correo(self, correo_obj, destinatario, nombre_trabajador, registro_trabajador, ciudad=None):
        """Envía el correo y actualiza el estado del registro.

        Acepta `ciudad` únicamente para incluirla en logs y en la respuesta
        (no se guarda en `RegistroExamenes`).
        """
        logger = logging.getLogger(__name__)
        try:
            # `destinatario` puede ser un string o una lista de emails
            recipient_list = destinatario if isinstance(destinatario, (list, tuple)) else [destinatario]

            # Log del cuerpo para verificación
            logger.info(f"Enviar correo - UUID lote: {correo_obj.uuid_correo}")
            logger.info(f"Enviar correo - Ciudad (desde JSON): {ciudad}")
            logger.info(f"Enviar correo - Cuerpo:\n{correo_obj.cuerpo_correo}")

            send_mail(
                subject=correo_obj.asunto,
                message=correo_obj.cuerpo_correo,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                fail_silently=False
            )

            # Marcar como enviado correctamente
            correo_obj.enviado_correctamente = True
            correo_obj.save()

            # Contar exámenes asignados
            total_examenes = registro_trabajador.examenes.count()

            return Response(
                {
                    "mensaje": "Correo enviado correctamente",
                    "uuid_lote": correo_obj.uuid_correo,
                    "uuid_trabajador": registro_trabajador.uuid_trabajador,
                    "trabajador": nombre_trabajador,
                    "destinatario": recipient_list,
                    "tipo_examen": correo_obj.tipo_examen,
                    "examenes_asignados": total_examenes,
                    "registro_id": registro_trabajador.id,
                    "ciudad": ciudad
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            # Registrar error
            correo_obj.enviado_correctamente = False
            correo_obj.error_envio = str(e)
            correo_obj.save()

            logger.error(f"Error enviando correo: {str(e)}", exc_info=True)

            return Response(
                {
                    "error": f"Error al enviar el correo: {str(e)}",
                    "uuid_lote": correo_obj.uuid_correo,
                    "uuid_trabajador": registro_trabajador.uuid_trabajador
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CargoEmpresaConExamenesView(APIView):
    """
    Vista para obtener empresas con sus cargos y exámenes asociados.
    Implementa cache de 8 horas para optimizar rendimiento.

    GET: Retorna lista de empresas con sus cargos y exámenes activos.
    """
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]
    CACHE_KEY = 'cargo_empresa_examenes_data'
    CACHE_TIMEOUT = 60 * 60 * 8  # 8 horas

    def get(self, request):
        """Obtiene empresas con cargos y exámenes, usando cache cuando está disponible."""
        # Intentar obtener desde cache
        cached_data = self._get_from_cache()
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK,
                            headers={'X-Cache': 'HIT'})

        # Generar datos frescos
        data = self._build_empresas_data()

        # Guardar en cache
        self._save_to_cache(data)

        return Response(data, status=status.HTTP_200_OK,
                        headers={'X-Cache': 'MISS'})

    def _get_from_cache(self):
        """Obtiene datos desde cache."""
        return cache.get(self.CACHE_KEY)

    def _save_to_cache(self, data):
        """Guarda datos en cache."""
        cache.set(self.CACHE_KEY, data, self.CACHE_TIMEOUT)

    def _build_empresas_data(self):
        """Construye estructura de datos con empresas, cargos, exámenes y estructura geográfica."""
        # Obtener empresas activas con exámenes activos
        empresas = Epresa.objects.filter(
            estadoempresa=1,
            examenes_por_cargo__examen__activo=True
        ).distinct().annotate(
            id_empresa=F('idempresa')
        ).values('id_empresa', 'nombre_empresa').order_by('nombre_empresa')

        # Serializar cada empresa con sus cargos y exámenes
        empresas_data = [
            EmpresaConCargosSerializer(empresa).data
            for empresa in empresas
        ]

        # Obtener lista de todos los exámenes activos
        examenes_list = list(
            Examen.objects.filter(activo=True)
            .order_by('nombre')
            .values('id_examen', 'nombre')
        )

        # Construir estructura geográfica: empresas → unidades → proyectos → centros
        estructura_geografica = self._build_estructura_geografica()

        return {
            'empresas': empresas_data,
            'examenes': examenes_list,
            'estructura': estructura_geografica
        }

    def _build_estructura_geografica(self):
        """
        Construye jerarquía geográfica de empresas activas:
        Empresa → Unidades → Proyectos → Centros (solo nombre, sin porcentajes, con claves personalizadas)
        """
        from analitica.models import Unidadnegocio, Proyecto

        centros = Centroop.objects.filter(
            estadocentrop=1
        ).select_related(
            'id_proyecto__id_unidad__id_empresa'
        ).order_by('nombrecentrop')

        empresas_dict = {}

        for centro in centros:
            proyecto = centro.id_proyecto
            if not proyecto or not proyecto.estadoproyecto:
                continue
            unidad = proyecto.id_unidad
            if not unidad or not unidad.estadounidad:
                continue
            empresa = unidad.id_empresa
            if not empresa or not empresa.estadoempresa:
                continue

            # Inicializar empresa si no existe
            if empresa.idempresa not in empresas_dict:
                empresas_dict[empresa.idempresa] = {
                    'idempresa': empresa.idempresa,
                    'empresa': empresa.nombre_empresa.strip(),
                    'tipo': 'empresa',
                    'unidades': {}
                }
            emp_dict = empresas_dict[empresa.idempresa]

            # Inicializar unidad si no existe
            if unidad.idunidad not in emp_dict['unidades']:
                emp_dict['unidades'][unidad.idunidad] = {
                    'idunidad': unidad.idunidad,
                    'unidad': unidad.nombreunidad.strip(),
                    'tipo': 'unidad',
                    'proyectos': {}
                }
            uni_dict = emp_dict['unidades'][unidad.idunidad]

            # Inicializar proyecto si no existe
            if proyecto.idproyecto not in uni_dict['proyectos']:
                uni_dict['proyectos'][proyecto.idproyecto] = {
                    'idproyecto': proyecto.idproyecto,
                    'proyecto': proyecto.nombreproyecto.strip(),
                    'tipo': 'proyecto',
                    'centrosop': []
                }
            proy_dict = uni_dict['proyectos'][proyecto.idproyecto]

            # Agregar centro (evitar duplicados)
            centro_data = {
                'idcentrop': centro.idcentrop,
                'centro_op': centro.nombrecentrop.strip(),
                'tipo': 'centro_op'
            }
            if centro_data not in proy_dict['centrosop']:
                proy_dict['centrosop'].append(centro_data)

        # Convertir dicts a listas ordenadas y limpiar ids
        resultado = []
        for emp_dict in sorted(empresas_dict.values(), key=lambda x: x['empresa']):
            emp_dict['unidades'] = sorted(
                emp_dict['unidades'].values(),
                key=lambda x: x['unidad']
            )
            for uni_dict in emp_dict['unidades']:
                uni_dict['proyectos'] = sorted(
                    uni_dict['proyectos'].values(),
                    key=lambda x: x['proyecto']
                )
            resultado.append(emp_dict)

        return resultado


class ImprimirReporteCorreosView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]

    def get(self, request):
        """
        Genera un reporte en Excel detallado con trabajadores y sus exámenes.

        Query params:
        - fecha_inicio: YYYY-MM-DD (opcional)
        - fecha_fin: YYYY-MM-DD (opcional)
        - empresas: IDs separados por coma o "all" (opcional, default: "all")
        """
        try:
            # Obtener parámetros de filtro
            fecha_inicio = request.GET.get('fecha_inicio')
            fecha_fin = request.GET.get('fecha_fin')
            empresas_param = request.GET.get('empresas', 'all')
            empresa_ids = []

            # Iniciar queryset base - ahora usamos RegistroExamenes
            # OPTIMIZADO: Prefetch de exámenes enviados para evitar N+1 en el loop
            queryset = RegistroExamenes.objects.select_related(
                'correo_lote', 'empresa', 'cargo', 'centro',
                'centro__id_proyecto', 'centro__id_proyecto__id_unidad'
            ).prefetch_related(
                Prefetch(
                    'examenes',
                    queryset=ExamenTrabajador.objects.select_related('examen'),
                    to_attr='examenes_enviados_precargados'
                )
            )

            # Validar y aplicar filtro de fechas
            if fecha_inicio:
                try:
                    fecha_inicio_dt = datetime.strptime(
                        fecha_inicio, '%Y-%m-%d')
                    fecha_inicio_dt = timezone.make_aware(fecha_inicio_dt)
                    queryset = queryset.filter(
                        correo_lote__fecha_envio__gte=fecha_inicio_dt)
                except ValueError:
                    return Response(
                        {"error": "Formato de fecha_inicio inválido. Use YYYY-MM-DD"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if fecha_fin:
                try:
                    fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
                    fecha_fin_dt = fecha_fin_dt + timedelta(days=1)
                    fecha_fin_dt = timezone.make_aware(fecha_fin_dt)
                    queryset = queryset.filter(
                        correo_lote__fecha_envio__lt=fecha_fin_dt)
                except ValueError:
                    return Response(
                        {"error": "Formato de fecha_fin inválido. Use YYYY-MM-DD"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validar y aplicar filtro de empresas
            if empresas_param != 'all':
                try:
                    empresa_ids = [int(id.strip())
                                   for id in empresas_param.split(',')]
                    empresas_existentes = Epresa.objects.filter(
                        idempresa__in=empresa_ids).values_list(
                        'idempresa', flat=True)
                    ids_no_encontrados = set(
                        empresa_ids) - set(empresas_existentes)
                    if ids_no_encontrados:
                        return Response(
                            {
                                "error": f"Las siguientes empresas no existen: {list(ids_no_encontrados)}"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    queryset = queryset.filter(empresa_id__in=empresa_ids)
                except ValueError:
                    return Response(
                        {"error": "IDs de empresas inválidos. Use números separados por coma"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Obtener registros
            registros = queryset.order_by(
                'empresa__nombre_empresa',
                'cargo__nombrecargo',
                'nombre_trabajador')

            if not registros.exists():
                if fecha_inicio and fecha_fin:
                    rango = f"desde {fecha_inicio} hasta {fecha_fin}"
                elif fecha_inicio:
                    rango = f"desde {fecha_inicio}"
                elif fecha_fin:
                    rango = f"hasta {fecha_fin}"
                else:
                    rango = "sin rango de fechas"

                if empresas_param != 'all':
                    empresas_nombres = Epresa.objects.filter(
                        idempresa__in=empresa_ids).values_list(
                        'nombre_empresa', flat=True)
                    empresas_str = ', '.join(empresas_nombres)
                    msg = (
                        f"No se encontraron registros para las "
                        f"empresas solicitadas en el rango indicado. "
                        f"Empresas: {empresas_str}. Rango: {rango}."
                    )
                    return Response({"error": msg}, status=status.HTTP_404_NOT_FOUND)

            # Obtener todos los exámenes activos
            examenes_activos = Examen.objects.filter(
                activo=True).order_by('nombre')
            nombres_examenes = [ex.nombre for ex in examenes_activos]

            # Crear el workbook de Excel
            wb = Workbook()
            ws = wb.active
            ws.title = "Reporte Detallado"

            # Estilos
            from openpyxl.styles import Border, Side
            header_fill = PatternFill(
                start_color="366092",
                end_color="366092",
                fill_type="solid")
            header_font = Font(bold=True, color="FFFFFF", size=11)
            center_alignment = Alignment(
                horizontal="center", vertical="center")
            border_style = Border(
                left=Side(style='thin', color='000000'),
                right=Side(style='thin', color='000000'),
                top=Side(style='thin', color='000000'),
                bottom=Side(style='thin', color='000000')
            )

            # Título del reporte
            num_cols = 11 + len(nombres_examenes)  # 11 columnas base + exámenes
            ws.merge_cells(f'A1:{get_column_letter(num_cols)}1')
            ws['A1'] = "REPORTE DETALLADO DE EXÁMENES POR TRABAJADOR"
            ws['A1'].font = Font(bold=True, size=14)
            ws['A1'].alignment = center_alignment

            # Información de filtros
            row = 3
            if fecha_inicio or fecha_fin:
                ws.merge_cells(f'A{row}:{get_column_letter(num_cols)}{row}')
                periodo = "Período: "
                if fecha_inicio and fecha_fin:
                    periodo += f"desde {fecha_inicio} hasta {fecha_fin}"
                elif fecha_inicio:
                    periodo += f"desde {fecha_inicio}"
                else:
                    periodo += f"hasta {fecha_fin}"
                ws[f'A{row}'] = periodo
                ws[f'A{row}'].font = Font(italic=True)
                row += 1

            if empresas_param != 'all':
                ws.merge_cells(f'A{row}:{get_column_letter(num_cols)}{row}')
                empresas_nombres = Epresa.objects.filter(
                    idempresa__in=empresa_ids).values_list(
                    'nombre_empresa', flat=True)
                ws[f'A{row}'] = f"Empresas: {', '.join(empresas_nombres)}"
                ws[f'A{row}'].font = Font(italic=True)
                row += 1

            row += 1

            # Encabezados
            headers = [
                "UUID Trabajador",
                "UUID Correo",
                "Empresa",
                "Unidad",
                "Proyecto",
                "Centro",
                "Cargo",
                "Nombre",
                "Cédula",
                "Tipo Examen",
                "Total Exámenes"] + nombres_examenes
            for col_num, header in enumerate(headers, start=1):
                cell = ws.cell(row=row, column=col_num, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = center_alignment
                cell.border = border_style

            row += 1
            data_start_row = row

            # Datos de trabajadores
            for registro in registros:
                # Obtener unidad y proyecto del centro
                centro = registro.centro
                unidad_nombre = (
                    centro.id_proyecto.id_unidad.nombreunidad
                    if centro and getattr(centro, 'id_proyecto', None) and getattr(centro.id_proyecto, 'id_unidad', None)
                    else ''
                )
                proyecto_nombre = (
                    centro.id_proyecto.nombreproyecto
                    if centro and getattr(centro, 'id_proyecto', None) else ''
                )

                # OPTIMIZADO: Usar exámenes precargados con Prefetch (sin query adicional)
                examenes_enviados = getattr(registro, 'examenes_enviados_precargados', [])

                # Crear set con nombres de exámenes enviados (sin importar estado)
                examenes_trabajador = set()
                for ex_env in examenes_enviados:
                    if ex_env.examen:
                        examenes_trabajador.add(ex_env.examen.nombre)

                total_examenes_trabajador = len(examenes_trabajador)

                row_data = [
                    registro.uuid_trabajador or '',
                    registro.correo_lote.uuid_correo if registro.correo_lote else '',
                    registro.empresa.nombre_empresa if registro.empresa else '',
                    unidad_nombre,
                    proyecto_nombre,
                    centro.nombrecentrop if centro else '',
                    registro.cargo.nombrecargo if registro.cargo else '',
                    registro.nombre_trabajador,
                    registro.documento_trabajador,
                    registro.tipo_examen or '',
                    total_examenes_trabajador  # Total horizontal por trabajador
                ]

                # Agregar X para cada examen enviado (sin importar estado)
                for nombre_examen in nombres_examenes:
                    if nombre_examen in examenes_trabajador:
                        row_data.append('X')
                    else:
                        row_data.append('')

                for col_num, value in enumerate(row_data, start=1):
                    cell = ws.cell(row=row, column=col_num, value=value)
                    cell.border = border_style
                    # Centrar desde columna 10 en adelante (Tipo Examen + Total + Exámenes)
                    if col_num >= 10:
                        cell.alignment = center_alignment

                row += 1

            data_end_row = row - 1

            # Fila de totales verticales
            totales_fill = PatternFill(
                start_color="DCE6F1",
                end_color="DCE6F1",
                fill_type="solid")
            
            ws.cell(row=row, column=1, value="TOTALES")
            ws.cell(row=row, column=1).font = Font(bold=True, size=12)
            ws.cell(row=row, column=1).fill = totales_fill
            ws.cell(row=row, column=1).border = border_style

            # Aplicar estilo a celdas vacías de la fila de totales
            for col in range(2, 11):  # Columnas 2-10 (hasta Tipo Examen)
                cell = ws.cell(row=row, column=col)
                cell.fill = totales_fill
                cell.border = border_style

            # Total de la columna "Total Exámenes" (suma vertical)
            col_total_examenes = 11
            suma_total_examenes = 0
            for r in range(data_start_row, data_end_row + 1):
                val = ws.cell(row=r, column=col_total_examenes).value
                if val and isinstance(val, int):
                    suma_total_examenes += val

            cell_total_vertical = ws.cell(row=row, column=col_total_examenes, value=suma_total_examenes)
            cell_total_vertical.font = Font(bold=True, size=11)
            cell_total_vertical.fill = totales_fill
            cell_total_vertical.alignment = center_alignment
            cell_total_vertical.border = border_style

            # Totales verticales por cada columna de examen
            col_inicio_examenes = 12  # Columna donde empiezan los exámenes
            gran_total_examenes = 0  # Para el total general
            
            for col_num in range(col_inicio_examenes, col_inicio_examenes + len(nombres_examenes)):
                # Contar X en cada columna (total vertical)
                total_col = 0
                for r in range(data_start_row, data_end_row + 1):
                    val = ws.cell(row=r, column=col_num).value
                    if val == 'X':
                        total_col += 1

                gran_total_examenes += total_col

                cell = ws.cell(row=row, column=col_num, value=total_col)
                cell.font = Font(bold=True, size=11)
                cell.fill = totales_fill
                cell.alignment = center_alignment
                cell.border = border_style

            # Columna adicional para GRAN TOTAL
            col_gran_total = col_inicio_examenes + len(nombres_examenes)
            
            # Agregar encabezado "TOTAL" en la fila de headers
            header_row = data_start_row - 1
            cell_header_total = ws.cell(row=header_row, column=col_gran_total, value="TOTAL")
            cell_header_total.fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            cell_header_total.font = Font(bold=True, color="FFFFFF", size=11)
            cell_header_total.alignment = center_alignment
            cell_header_total.border = border_style

            # Agregar totales horizontales por cada trabajador
            for r in range(data_start_row, data_end_row + 1):
                total_horizontal = 0
                for col_num in range(col_inicio_examenes, col_inicio_examenes + len(nombres_examenes)):
                    if ws.cell(row=r, column=col_num).value == 'X':
                        total_horizontal += 1
                
                cell = ws.cell(row=r, column=col_gran_total, value=total_horizontal)
                cell.alignment = center_alignment
                cell.border = border_style

            # Gran total en la esquina (suma de todos los exámenes)
            cell_gran_total = ws.cell(row=row, column=col_gran_total, value=gran_total_examenes)
            cell_gran_total.font = Font(bold=True, size=12)
            cell_gran_total.fill = PatternFill(start_color="92D050", end_color="92D050", fill_type="solid")
            cell_gran_total.alignment = center_alignment
            cell_gran_total.border = border_style

            # Ajustar anchos de columnas
            ws.column_dimensions['A'].width = 40  # UUID Trabajador
            ws.column_dimensions['B'].width = 30  # UUID Correo
            ws.column_dimensions['C'].width = 25  # Empresa
            ws.column_dimensions['D'].width = 20  # Unidad
            ws.column_dimensions['E'].width = 25  # Proyecto
            ws.column_dimensions['F'].width = 20  # Centro
            ws.column_dimensions['G'].width = 25  # Cargo
            ws.column_dimensions['H'].width = 25  # Nombre
            ws.column_dimensions['I'].width = 15  # Cédula
            ws.column_dimensions['J'].width = 18  # Tipo Examen
            ws.column_dimensions['K'].width = 12  # Total Exámenes

            # Columnas de exámenes
            for col_num in range(col_inicio_examenes, col_inicio_examenes + len(nombres_examenes)):
                col_letter = get_column_letter(col_num)
                ws.column_dimensions[col_letter].width = 6

            # Columna TOTAL
            ws.column_dimensions[get_column_letter(col_gran_total)].width = 8

            # Generar el archivo
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'reporte_trabajadores_examenes_{timestamp}.xlsx'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            wb.save(response)
            return response

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error interno: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Error interno: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EnviarCorreoMasivoView(APIView):
    """
    Envía un correo masivo a múltiples trabajadores desde un CSV.
    Crea un registro CorreoExamenEnviado y N registros RegistroExamenes.
    """
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]

    def post(self, request):
        """
        POST: Procesa CSV y envía correo masivo

        Request:
        {
            "archivo_csv": <file>,
            "asunto": "Convocatoria a exámenes",
            "cuerpo_correo": "<p>Estimado participante...</p>"
        }

        CSV esperado:
        nombre,documento,empresa_id,cargo_id
        Juan Pérez,12345678,6,1
        María García,87654321,6,2
        """
        logger = logging.getLogger(__name__)

        try:
            logger.info("=== INICIO EnviarCorreoMasivoView ===")
            logger.info(f"Request data keys: {request.data.keys()}")
            logger.info(f"Request FILES keys: {request.FILES.keys()}")

            serializer = EnviarCorreoMasivoSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Serializer validation failed: {serializer.errors}")
                return Response(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)

            archivo_csv = serializer.validated_data['archivo_csv']
            # asunto y cuerpo_correo ya no se leen del request, se generan
            # automáticamente

            # Leer CSV con múltiples intentos de codificación y delimitadores
            archivo_csv.seek(0)

            # Intentar diferentes codificaciones
            contenido_csv = None
            for encoding in ['utf-8-sig', 'utf-8',
                             'latin-1', 'iso-8859-1', 'cp1252']:
                try:
                    archivo_csv.seek(0)
                    contenido_csv = archivo_csv.read().decode(encoding)
                    logger.info(
                        f"CSV decodificado exitosamente con "
                        f"encoding: {encoding}"
                    )
                    break
                except (UnicodeDecodeError, AttributeError):
                    continue

            if contenido_csv is None:
                logger.error(
                    "No se pudo decodificar el CSV con ninguna codificación")
                return Response(
                    {
                        "error": (
                            "No se pudo leer el archivo CSV. "
                            "Verifique la codificación del archivo."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Detectar delimitador (coma o punto y coma)
            sniffer = csv.Sniffer()
            try:
                # Muestra de los primeros 1024 caracteres
                sample = contenido_csv[:1024]
                dialect = sniffer.sniff(sample, delimiters=',;')
                delimiter = dialect.delimiter
                logger.info(f"Delimitador detectado: '{delimiter}'")
            except Exception:
                # Si falla la detección, usar coma por defecto
                delimiter = ','
                logger.warning(
                    "No se pudo detectar delimitador, usando coma por defecto")

            # Leer CSV con el delimitador detectado
            stream = io.StringIO(contenido_csv)
            reader = csv.DictReader(stream, delimiter=delimiter)

            # Obtener y validar headers ANTES de leer los datos
            if not reader.fieldnames:
                logger.error("CSV sin encabezados")
                return Response(
                    {"error": "El archivo CSV no tiene encabezados"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Normalizar nombres de columnas a minúsculas
            fieldnames = [f.strip().lower() for f in reader.fieldnames]
            logger.info(f"CSV fieldnames detectados: {fieldnames}")

            # Aceptamos encabezados en español: Empresa, Unidad, Proyecto,
            # Centro, Nombre, CC, Ciudad, cargo, TipoExamen, Examenes
            expected = {
                'empresa',
                'unidad',
                'proyecto',
                'centro',
                'nombre',
                'cc',
                'ciudad',
                'cargo',
                'tipoexamen',
                'examenes'}

            if not expected.issubset(set(fieldnames)):
                logger.error(
                    f"Columnas faltantes. Expected: {expected}, Got: {
                        set(fieldnames)}")
                return Response(
                    {
                        "error": f"El CSV debe contener las columnas: {
                            ', '.join(
                                sorted(expected))} (insensible a mayúsculas). Columnas recibidas: {
                            ', '.join(fieldnames)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            trabajadores_data = list(reader)
            logger.info(f"Total de filas en CSV: {len(trabajadores_data)}")

            if not trabajadores_data:
                return Response(
                    {"error": "El archivo CSV está vacío"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ===================================================================
            # FASE 1: VALIDACIÓN COMPLETA DEL CSV (NO SE ENVÍA NADA AÚN)
            # ===================================================================
            # OPTIMIZACIÓN: Precargar todos los catálogos antes del loop
            # Esto reduce de N queries por fila a solo 6 queries totales
            
            # Precargar empresas (nombre_lower -> objeto)
            empresas_map = {
                e.nombre_empresa.lower().strip(): e 
                for e in Epresa.objects.all()
            }
            
            # Precargar unidades con su empresa (nombre_lower, empresa_id) -> objeto
            unidades_map = {
                (u.nombreunidad.lower().strip(), u.id_empresa_id): u
                for u in Unidadnegocio.objects.select_related('id_empresa').all()
            }
            
            # Precargar proyectos con su unidad (nombre_lower, unidad_id) -> objeto
            proyectos_map = {
                (p.nombreproyecto.lower().strip(), p.id_unidad_id): p
                for p in Proyecto.objects.select_related('id_unidad').all()
            }
            
            # Precargar centros con su proyecto (nombre_lower, proyecto_id) -> objeto
            centros_map = {
                (c.nombrecentrop.lower().strip(), c.id_proyecto_id): c
                for c in Centroop.objects.select_related('id_proyecto').all()
            }
            
            # Precargar cargos (nombre_lower -> objeto)
            cargos_map = {
                c.nombrecargo.lower().strip(): c
                for c in Cargo.objects.all()
            }
            
            # Precargar exámenes activos (nombre_lower -> objeto)
            examenes_map = {
                e.nombre.lower().strip(): e
                for e in Examen.objects.filter(activo=True)
            }
            
            logger.info(f"Catálogos precargados: {len(empresas_map)} empresas, "
                       f"{len(unidades_map)} unidades, {len(proyectos_map)} proyectos, "
                       f"{len(centros_map)} centros, {len(cargos_map)} cargos, "
                       f"{len(examenes_map)} exámenes")
            
            # Validar y procesar cada trabajador (resolviendo jerarquía:
            # empresa -> unidad -> proyecto -> centro)
            trabajadores_validos = []
            errores_validacion = []

            for idx, trab in enumerate(trabajadores_data, start=2):
                try:
                    # Normalizar lectura por columna (soportar
                    # mayúsculas/espacios)
                    row = {
                        k.strip().lower(): (
                            v.strip() if isinstance(
                                v,
                                str) else v) for k,
                        v in trab.items()}

                    empresa_name = (row.get('empresa') or '').strip()
                    unidad_name = (row.get('unidad') or '').strip()
                    proyecto_name = (row.get('proyecto') or '').strip()
                    nombre = (row.get('nombre') or '').strip()
                    documento = (row.get('cc') or '').strip()
                    cargo_name = (row.get('cargo') or '').strip()
                    centro_name = (row.get('centro') or '').strip()
                    ciudad = (row.get('ciudad') or '').strip()  # Capturar ciudad
                    tipo_examen = (
                        # INGRESO o PERIODICO
                        row.get('tipoexamen') or ''
                    ).upper().strip()
                    examenes_str = (row.get('examenes') or '').strip()

                    if not nombre or not documento:
                        errores_validacion.append(
                            f"Línea {idx}: Nombre y/o CC vacío")
                        continue

                    # Validar tipo de examen
                    tipos_validos = ['INGRESO', 'PERIODICO', 'RETIRO', 'ESPECIAL', 'POST_INCAPACIDAD']
                    if tipo_examen not in tipos_validos:
                        errores_validacion.append(
                            f"Línea {idx}: TipoExamen debe ser uno de "
                            f"{', '.join(tipos_validos)}, "
                            f"recibido: '{tipo_examen}'"
                        )
                        continue

                    # Validar que hay exámenes especificados
                    if not examenes_str:
                        errores_validacion.append(
                            f"Línea {idx}: Campo 'Examenes' vacío")
                        continue

                    # Parsear exámenes (separados por coma)
                    examenes_nombres = [
                        e.strip() for e in examenes_str.split(',') if e.strip()]
                    if not examenes_nombres:
                        errores_validacion.append(
                            f"Línea {idx}: No hay exámenes válidos en el campo 'Examenes'")
                        continue

                    # OPTIMIZADO: Buscar empresa usando mapa precargado (O(1) en lugar de query)
                    empresa = empresas_map.get(empresa_name.lower())
                    if not empresa:
                        errores_validacion.append(
                            f"Línea {idx}: Empresa '{empresa_name}' no encontrada")
                        continue

                    # OPTIMIZADO: Buscar unidad usando mapa precargado
                    unidad = unidades_map.get((unidad_name.lower(), empresa.idempresa))
                    if not unidad:
                        errores_validacion.append(
                            f"Línea {idx}: Unidad '{unidad_name}' no encontrada para empresa '{empresa.nombre_empresa}'")
                        continue

                    # OPTIMIZADO: Buscar proyecto usando mapa precargado
                    proyecto = proyectos_map.get((proyecto_name.lower(), unidad.idunidad))
                    if not proyecto:
                        errores_validacion.append(
                            f"Línea {idx}: Proyecto '{proyecto_name}' no encontrado para unidad '{unidad.nombreunidad}'")
                        continue

                    # OPTIMIZADO: Buscar centro usando mapa precargado
                    centro = centros_map.get((centro_name.lower(), proyecto.idproyecto))
                    if not centro:
                        errores_validacion.append(
                            f"Línea {idx}: Centro '{centro_name}' no encontrado para proyecto '{proyecto.nombreproyecto}'"
                        )
                        continue

                    # OPTIMIZADO: Buscar cargo usando mapa precargado
                    cargo = cargos_map.get(cargo_name.lower())
                    if not cargo:
                        errores_validacion.append(
                            f"Línea {idx}: Cargo '{cargo_name}' no encontrado")
                        continue

                    # OPTIMIZADO: Validar exámenes usando mapa precargado
                    examenes_bd = []
                    examen_invalido = False
                    for examen_nombre in examenes_nombres:
                        examen = examenes_map.get(examen_nombre.lower())
                        if not examen:
                            errores_validacion.append(
                                f"Línea {idx}: Examen '{examen_nombre}' "
                                f"no encontrado o no está activo"
                            )
                            examen_invalido = True
                            break
                        examenes_bd.append(examen)
                    
                    if examen_invalido:
                        continue
                    
                    # Todos los datos son válidos
                    trabajadores_validos.append({
                        'nombre': nombre,
                        'documento': documento,
                        'empresa': empresa,
                        'unidad': unidad,
                        'proyecto': proyecto,
                        'centro': centro,
                        'ciudad': ciudad,  # Agregar ciudad
                        'cargo': cargo,
                        'tipo_examen': tipo_examen,
                        'examenes_nombres': examenes_nombres,  # Nombres como strings
                        'examenes_bd': examenes_bd,  # Objetos de BD
                    })

                except Exception as e:
                    errores_validacion.append(f"Línea {idx}: {str(e)}")

            # ===================================================================
            # VALIDACIÓN COMPLETADA - VERIFICAR ERRORES ANTES DE CONTINUAR
            # ===================================================================
            # Si hay errores de validación, retornarlos SIN crear registros ni
            # enviar correos
            if errores_validacion:
                return Response(
                    {
                        "mensaje": "Errores encontrados en el CSV. No se envió ningún correo.",
                        "errores": errores_validacion,
                        "trabajadores_validos": len(trabajadores_validos),
                        "total_trabajadores": len(trabajadores_data)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar que al menos haya un trabajador válido
            if not trabajadores_validos:
                return Response(
                    {
                        "mensaje": "No se envió ningún correo.",
                        "error": "Ningún trabajador cumple los requisitos de validación"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ===================================================================
            # FASE 2: TODOS LOS TRABAJADORES SON VÁLIDOS - PROCEDER AL ENVÍO
            # ===================================================================
            # Agrupar trabajadores por tipo de examen para saber si será
            # INGRESO, PERIODICO o MIXTO
            tipos_examen_unicos = set(t['tipo_examen']
                                      for t in trabajadores_validos)
            tipo_examen_principal = list(tipos_examen_unicos)[0] if len(
                tipos_examen_unicos) == 1 else 'MIXTO'

            # Generar UUID para el lote
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            uuid_correo = f"{unique_id}-{timestamp}"

            # Construir el cuerpo del correo con el UUID del lote
            # y datos del colaborador que realiza el envío
            # Obtener el colaborador del usuario autenticado (puede ser objeto o id)
            colaborador = (
                request.user.idcolaboradoru if hasattr(
                    request.user, 'idcolaboradoru') else None
            )

            # Intentar resolver al objeto Colaboradores y extraer nombre/correo
            nombre_colaborador = None
            correo_colaborador = None
            try:
                from usuarios.models import Colaboradores
                if isinstance(colaborador, Colaboradores):
                    colaborador_obj = colaborador
                elif colaborador is not None:
                    # Si viene como id (o FK value), intentar obtener objeto
                    colaborador_obj = Colaboradores.objects.filter(pk=getattr(colaborador, 'idcolaborador', colaborador)).first()
                else:
                    colaborador_obj = None

                if colaborador_obj:
                    nombre_colaborador = getattr(colaborador_obj, 'nombrecolaborador', None)
                    correo_colaborador = getattr(colaborador_obj, 'correocolaborador', None)
            except Exception:
                # Fallback: usar datos del user
                colaborador_obj = None

            if not nombre_colaborador:
                nombre_colaborador = (getattr(request.user, 'get_full_name', lambda: None)() or getattr(request.user, 'username', None))
            if not correo_colaborador:
                correo_colaborador = getattr(request.user, 'email', None)

            cuerpo_final = f"""
<html>
<body>
    <p>Cordial Saludo.</p>
    <p>Se han programado los siguientes exámenes médicos
para los trabajadores en el excel adjunto.</p>
    <br>
    <hr>
    <p><strong>ID de Seguimiento:</strong> {uuid_correo}</p>
    <p><strong>Solicitante:</strong> {nombre_colaborador if nombre_colaborador else 'No disponible'}</p>
    <p><strong>Correo del solicitante:</strong> {correo_colaborador if correo_colaborador else 'No disponible'}</p>
</body>
</html>
"""

            correos_destino = (
                "practicante.desarrollogh@regency.com.co,"
                #"operativo@servicompetentes.com,"
                #"administrativo@servicompetentes.com,"
            )
            # Split and filter out any empty items (avoid trailing-comma empties)
            correos_list = [email.strip() for email in correos_destino.split(',') if email.strip()]

            # Obtener el colaborador del usuario autenticado
            colaborador = (
                request.user.idcolaboradoru if hasattr(
                    request.user, 'idcolaboradoru') else None
            )

            # Asunto del correo
            asunto_correo = "Exámenes médicos"

            # Crear registro CorreoExamenEnviado
            correo_lote = CorreoExamenEnviado.objects.create(
                uuid_correo=uuid_correo,
                enviado_por=colaborador,
                asunto=asunto_correo,
                cuerpo_correo=cuerpo_final,
                correos_destino=correos_destino,
                tipo_examen=tipo_examen_principal,
                enviado_correctamente=False
            )

            # Crear registros RegistroExamenes (uno por trabajador)
            # Generar UUIDs manualmente porque bulk_create no ejecuta save()
            registros = []

            for trab in trabajadores_validos:
                uuid_trabajador = str(uuid.uuid4())
                # Guardar exámenes como string separado por coma
                examenes_str = ','.join(trab['examenes_nombres'])

                registro = RegistroExamenes(
                    correo_lote=correo_lote,
                    nombre_trabajador=trab['nombre'],
                    documento_trabajador=trab['documento'],
                    ciudad=trab.get('ciudad'),
                    empresa=trab['empresa'],
                    cargo=trab['cargo'],
                    centro=trab.get('centro'),
                    uuid_trabajador=uuid_trabajador,
                    tipo_examen=trab['tipo_examen'],
                    examenes_asignados=examenes_str
                )
                registros.append(registro)
                # Guardar UUID en trabajadores_validos para Excel
                trab['uuid_trabajador'] = uuid_trabajador
                trab['registro_para_relacion'] = (
                    registro, trab['examenes_bd'])

            # Guardar registros con UUIDs ya generados
            RegistroExamenes.objects.bulk_create(
                registros, ignore_conflicts=True)

            # Crear relaciones ExamenTrabajador (muchos a muchos)
            # Primero obtener los registros guardados
            from examenes.models import ExamenTrabajador
            registros_guardados = {}
            for trab in trabajadores_validos:
                registro_guardado = RegistroExamenes.objects.get(
                    uuid_trabajador=trab['uuid_trabajador'])
                registros_guardados[trab['uuid_trabajador']
                                    ] = registro_guardado

            # Crear relaciones
            examen_trabajador_batch = []
            for trab in trabajadores_validos:
                registro_guardado = registros_guardados[trab['uuid_trabajador']]
                for examen in trab['examenes_bd']:
                    et = ExamenTrabajador(
                        registro_examen=registro_guardado,
                        examen=examen
                    )
                    examen_trabajador_batch.append(et)

            # Guardar relaciones (ignorar duplicados)
            ExamenTrabajador.objects.bulk_create(
                examen_trabajador_batch, ignore_conflicts=True)
            logger.info(
                f"Creadas {
                    len(examen_trabajador_batch)} relaciones ExamenTrabajador")

            # Nota: No creamos `RegistroExamenesEnviados` para trazabilidad en
            # el flujo masivo. La fuente de verdad del estado es
            # `RegistroExamenes.estado_trabajador` y las asignaciones están
            # representadas en `ExamenTrabajador`.

            # Enviar correo SIEMPRE con Excel adjunto
            try:
                # Generar Excel con formato tabla y exámenes como columnas,
                # separado por tipo
                excel_buffer = self._generar_excel_por_tipo(
                    trabajadores_validos)

                email = EmailMultiAlternatives(
                    subject=asunto_correo,
                    body='Por favor, abra este correo en un cliente que soporte HTML.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=correos_list
                )
                email.attach_alternative(cuerpo_final, "text/html")
                email.attach(
                    'Trabajadores_Examenes.xlsx',
                    excel_buffer.getvalue(),
                    'application/vnd.openxmlformats-officedocument.'
                    'spreadsheetml.sheet'
                )
                email.send(fail_silently=False)

                correo_lote.enviado_correctamente = True
                correo_lote.save()

            except Exception as e:
                correo_lote.error_envio = str(e)
                correo_lote.save()
                return Response(
                    {
                        "error": f"Error al enviar correo: {str(e)}",
                        "uuid_correo": uuid_correo,
                        "trabajadores_registrados": len(registros)
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Respuesta exitosa
            return Response(
                {
                    "uuid_correo": uuid_correo,
                    "total_trabajadores": len(trabajadores_validos),
                    "enviado_a": correos_list,
                    "estado": "Enviado exitosamente",
                    "detalle": (
                        f"Se envió correo a {len(correos_list)} "
                        f"destinatarios con {len(trabajadores_validos)} "
                        f"trabajadores"
                    )
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            import traceback
            logger = logging.getLogger(__name__)

            logger.error("=== ERROR EN EnviarCorreoMasivoView ===")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Exception message: {str(e)}")
            logger.error(
                f"Traceback:\n{traceback.format_exc()}"
            )

            error_msg = (
                f"Error interno: {str(e)}\n"
                f"{traceback.format_exc()}"
            )
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _generar_excel_examenes(self, trabajadores):
        """Genera Excel con formato tabla donde los exámenes son columnas con X"""
        from openpyxl import Workbook
        from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
        from io import BytesIO

        # Obtener solo los exámenes que al menos un trabajador requiere
        examenes_requeridos = set()
        for trab in trabajadores:
            examenes_requeridos.update(trab['examenes'])

        # Ordenar alfabéticamente los exámenes requeridos
        nombres_examenes = sorted(list(examenes_requeridos))

        wb = Workbook()
        ws = wb.active
        ws.title = "Trabajadores Examenes"

        # Estilos
        header_fill = PatternFill(
            start_color="366092",
            end_color="366092",
            fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF", size=11)
        center_alignment = Alignment(horizontal="center", vertical="center")
        border_style = Border(
            left=Side(style='thin', color='000000'),
            right=Side(style='thin', color='000000'),
            top=Side(style='thin', color='000000'),
            bottom=Side(style='thin', color='000000')
        )

        # Encabezados: UUID primero, luego datos base con Cargo después de
        # Centro
        headers = [
            "UUID",
            "Empresa",
            "Unidad",
            "Proyecto",
            "Centro",
            "Cargo",
            "Nombre",
            "Documento"] + nombres_examenes
        ws.append(headers)

        # Aplicar estilos a encabezados
        for col_num, header in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = center_alignment
            cell.border = border_style

        # Agregar datos de trabajadores
        for trab in trabajadores:
            row_data = [
                trab.get('uuid_trabajador', ''),  # UUID primero
                trab['empresa'].nombre_empresa,
                trab['unidad'].nombreunidad,
                trab['proyecto'].nombreproyecto,
                (trab['centro'].nombrecentrop if trab.get('centro') else ''),
                trab['cargo'].nombrecargo,  # Cargo después de Centro
                trab['nombre'],
                trab['documento']
            ]

            # Para cada examen, verificar si el cargo de este trabajador lo
            # requiere
            # exámenes que requiere este trabajador
            examenes_trabajador = set(trab['examenes'])

            for nombre_examen in nombres_examenes:
                if nombre_examen in examenes_trabajador:
                    row_data.append('X')
                else:
                    row_data.append('')

            ws.append(row_data)

        # Aplicar bordes y centrado a todas las celdas de datos
        for row in ws.iter_rows(
                min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            for cell in row:
                cell.border = border_style
                # Centrar las X de los exámenes (ahora desde columna 9 porque
                # agregamos UUID)
                if cell.column >= 9:  # Columnas de exámenes
                    cell.alignment = center_alignment

        # Ajustar ancho de columnas
        ws.column_dimensions['A'].width = 40  # UUID (primera columna)
        ws.column_dimensions['B'].width = 25  # Empresa
        ws.column_dimensions['C'].width = 20  # Unidad
        ws.column_dimensions['D'].width = 25  # Proyecto
        ws.column_dimensions['E'].width = 20  # Centro
        ws.column_dimensions['F'].width = 25  # Cargo
        ws.column_dimensions['G'].width = 25  # Nombre
        ws.column_dimensions['H'].width = 15  # Documento

        # Ajustar ancho de columnas de exámenes (más pequeñas)
        for col_num in range(9, 9 + len(nombres_examenes)):
            col_letter = get_column_letter(col_num)
            ws.column_dimensions[col_letter].width = 5

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

    def _generar_excel_por_tipo(self, trabajadores):
        """Genera Excel con una sola hoja con todos los trabajadores, incluyendo tipo de examen"""
        from openpyxl import Workbook
        from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
        from io import BytesIO

        wb = Workbook()
        ws = wb.active
        ws.title = "Trabajadores Examenes"

        # Estilos comunes
        header_fill = PatternFill(
            start_color="366092",
            end_color="366092",
            fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF", size=11)
        center_alignment = Alignment(horizontal="center", vertical="center")
        border_style = Border(
            left=Side(style='thin', color='000000'),
            right=Side(style='thin', color='000000'),
            top=Side(style='thin', color='000000'),
            bottom=Side(style='thin', color='000000')
        )

        # Obtener todos los exámenes únicos de todos los trabajadores
        examenes_requeridos = set()
        for trab in trabajadores:
            examenes_requeridos.update(trab['examenes_nombres'])
        nombres_examenes = sorted(list(examenes_requeridos))

        # Encabezados - incluye "Ciudad" y "Tipo Examen"
        headers = [
            "UUID",
            "Empresa",
            "Unidad",
            "Proyecto",
            "Centro",
            "Ciudad",
            "Cargo",
            "Nombre",
            "Documento",
            "Tipo Examen"] + nombres_examenes
        ws.append(headers)

        # Aplicar estilos a encabezados
        for col_num, header in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = center_alignment
            cell.border = border_style

        # Ordenar trabajadores por tipo de examen
        orden_tipos = ['INGRESO', 'PERIODICO', 'RETIRO', 'ESPECIAL', 'POST_INCAPACIDAD']
        trabajadores_ordenados = sorted(
            trabajadores,
            key=lambda x: orden_tipos.index(x['tipo_examen']) if x['tipo_examen'] in orden_tipos else 999
        )

        # Agregar datos de todos los trabajadores
        for trab in trabajadores_ordenados:
            row_data = [
                trab.get('uuid_trabajador', ''),
                trab['empresa'].nombre_empresa,
                trab['unidad'].nombreunidad,
                trab['proyecto'].nombreproyecto,
                (trab['centro'].nombrecentrop if trab.get('centro') else ''),
                trab.get('ciudad', ''),  # Ciudad
                trab['cargo'].nombrecargo,
                trab['nombre'],
                trab['documento'],
                trab['tipo_examen']
            ]

            # Exámenes con X donde aplica
            examenes_trabajador = set(trab['examenes_nombres'])
            for nombre_examen in nombres_examenes:
                if nombre_examen in examenes_trabajador:
                    row_data.append('X')
                else:
                    row_data.append('')

            ws.append(row_data)

        # Aplicar bordes y centrado a todas las filas de datos
        for row in ws.iter_rows(
                min_row=2, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            for cell in row:
                cell.border = border_style
                if cell.column >= 11:  # Columnas de exámenes empiezan en 11 (después de Ciudad)
                    cell.alignment = center_alignment

        # Ajustar ancho de columnas
        ws.column_dimensions['A'].width = 40  # UUID
        ws.column_dimensions['B'].width = 25  # Empresa
        ws.column_dimensions['C'].width = 20  # Unidad
        ws.column_dimensions['D'].width = 25  # Proyecto
        ws.column_dimensions['E'].width = 20  # Centro
        ws.column_dimensions['F'].width = 18  # Ciudad
        ws.column_dimensions['G'].width = 25  # Cargo
        ws.column_dimensions['H'].width = 25  # Nombre
        ws.column_dimensions['I'].width = 15  # Documento
        ws.column_dimensions['J'].width = 18  # Tipo Examen

        # Columnas de exámenes (empiezan en columna 11 = K)
        for col_num in range(11, 11 + len(nombres_examenes)):
            col_letter = get_column_letter(col_num)
            ws.column_dimensions[col_letter].width = 5

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

class ListarTrabajadoresCorreoView(APIView):
    """
    Endpoint para listar trabajadores de un correo con paginación.

    Optimización:
    - Prefetch de `ExamenTrabajador` para evitar N+1 queries
    - Usa `to_attr` para acceso directo sin queries adicionales
    """
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]
    pagination_class = PageNumberPagination

    def _serializar_trabajador(self, trabajador):
        """Serializa un trabajador con sus exámenes de RegistroExamenesEnviados (ya precargados)"""
        # OPTIMIZADO: Usar exámenes precargados con Prefetch
        # Usar ExamenTrabajador precargado para listar exámenes asignados
        examenes_rel = getattr(trabajador, 'examenes_precargados', [])

        examenes_detalle = []
        for ex_rel in examenes_rel:
            examen = getattr(ex_rel, 'examen', None)
            examenes_detalle.append({
                'id': getattr(ex_rel, 'id', None),
                'examen_id': examen.id_examen if examen else None,
                'examen_nombre': examen.nombre if examen else 'N/A',
                # No disponemos de estado por examen cuando no usamos
                # RegistroExamenesEnviados; mostramos estado a nivel de trabajador
                'tipo_examen': trabajador.tipo_examen,
                'estado': None,
                'resultado': None,
                'fecha_envio': getattr(ex_rel, 'fecha_asignacion', None),
                'fecha_completado': None
            })

        return {
            'id': trabajador.id,
            'correo_id': trabajador.correo_lote_id,
            'uuid_trabajador': trabajador.uuid_trabajador,
            'nombre_trabajador': trabajador.nombre_trabajador,
            'documento_trabajador': trabajador.documento_trabajador,
            'cargo_nombre': trabajador.cargo.nombrecargo if trabajador.cargo else None,
            'empresa_nombre': trabajador.empresa.nombre_empresa if trabajador.empresa else None,
            'tipo_examen': trabajador.tipo_examen,
            'examenes_asignados': trabajador.examenes_asignados,
            'examenes': examenes_detalle,
            'total_examenes': len(examenes_detalle),
            # Cuando no se usa RegistroExamenesEnviados, el estado es a nivel
            # de trabajador y se refleja en `estado_trabajador`.
            'examenes_completados': (len(examenes_detalle) if trabajador.estado_trabajador == 1 else 0),
            'examenes_pendientes': (0 if trabajador.estado_trabajador == 1 else len(examenes_detalle)),
            'estado_trabajador': trabajador.estado_trabajador,
            'estado_nombre': "Completado" if trabajador.estado_trabajador == 1 else "Pendiente"
        }

    def get(self, request, correo_id):
        """
        Obtiene lista paginada de trabajadores de un correo

        Parámetros query:
        - page: número de página (default 1)
        """
        try:
            correo = CorreoExamenEnviado.objects.get(id=correo_id)
        except CorreoExamenEnviado.DoesNotExist:
            return Response(
                {"error": "Correo no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        # OPTIMIZADO: Prefetch de exámenes para evitar N+1 queries en serialización

        search = request.query_params.get('search', '').strip()
        trabajadores_qs = RegistroExamenes.objects.filter(
            correo_lote=correo
        ).select_related('empresa', 'cargo').prefetch_related(
            Prefetch(
                'examenes',
                queryset=ExamenTrabajador.objects.select_related('examen'),
                to_attr='examenes_precargados'
            )
        ).order_by('-fecha_registro')

        if search:
            from django.db.models import Q
            trabajadores_qs = trabajadores_qs.filter(
                Q(uuid_trabajador__icontains=search) |
                Q(documento_trabajador__icontains=search)
            )
        trabajadores = trabajadores_qs

        # Cache por correo_id + paginación
        page = request.query_params.get('page', '1')
        page_size = request.query_params.get('page_size', '25')
        cache_key = f"trabajadores_correo_v2={correo_id}_page={page}_size={page_size}"

        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK, headers={'X-Cache': 'HIT'})

        # Paginar resultados
        paginator = self.pagination_class()
        paginated_trabajadores = paginator.paginate_queryset(
            trabajadores, request)

        if paginated_trabajadores is not None:
            # Serializar con exámenes individuales
            results = [self._serializar_trabajador(t) for t in paginated_trabajadores]
            
            paginated_response = paginator.get_paginated_response(results)
            # Agregar metadata del correo
            paginated_response.data.update({
                "correo_id": correo.id,
                "uuid_correo": getattr(correo, 'uuid_correo', None),
                "asunto": correo.asunto,
                "tipo_examen_lote": correo.tipo_examen,
                "fecha_envio": getattr(correo, 'fecha_envio', None),
                "total_trabajadores": trabajadores.count(),
                "tipos_examen_disponibles": TIPOS_EXAMEN_VALIDOS
            })
            paginated_response['X-Cache'] = 'MISS'
            cache.set(cache_key, paginated_response.data, timeout=300)
            return paginated_response

        # Fallback sin paginación (estructura equivalente)
        results = [self._serializar_trabajador(t) for t in trabajadores]
        data = {
            "count": len(results),
            "next": None,
            "previous": None,
            "results": results,
            "correo_id": correo.id,
            "uuid_correo": getattr(correo, 'uuid_correo', None),
            "asunto": correo.asunto,
            "tipo_examen_lote": correo.tipo_examen,
            "fecha_envio": getattr(correo, 'fecha_envio', None),
            "total_trabajadores": trabajadores.count(),
            "tipos_examen_disponibles": TIPOS_EXAMEN_VALIDOS
        }
        cache.set(cache_key, data, timeout=300)
        return Response(data, status=status.HTTP_200_OK, headers={'X-Cache': 'MISS'})


class ListarRegistrosPorTipoExamenView(APIView):
    """
    Endpoint para listar registros filtrados por tipo de examen.
    
    Optimización:
    - Prefetch de exámenes enviados para evitar N+1 queries
    - Cache de 5 minutos por tipo de examen
    """
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]

    def get(self, request):
        tipo_examen = request.query_params.get('tipo', '').upper()

        if not tipo_examen or tipo_examen not in TIPOS_EXAMEN_VALIDOS:
            return Response(
                {
                    "error": f"Tipo invalido. Debe ser uno de: {', '.join(TIPOS_EXAMEN_VALIDOS)}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Intentar obtener de cache
        cache_key = f"registros_tipo_examen_{tipo_examen}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK, headers={'X-Cache': 'HIT'})

        # OPTIMIZADO: Prefetch de exámenes para evitar N+1 queries
        registros = RegistroExamenes.objects.filter(
            tipo_examen=tipo_examen
        ).select_related('correo_lote', 'empresa', 'cargo').prefetch_related(
            Prefetch(
                'examenes',
                queryset=ExamenTrabajador.objects.select_related('examen'),
                to_attr='examenes_precargados'
            )
        ).order_by('-id')[:50]

        resultados = []
        for reg in registros:
            # OPTIMIZADO: Usar exámenes precargados (sin query adicional)
            examenes_enviados = getattr(reg, 'examenes_precargados', [])

            # Preparar detalle de exámenes a partir de ExamenTrabajador
            examenes_detalle = []
            for ex_rel in examenes_enviados:
                examen = getattr(ex_rel, 'examen', None)
                examenes_detalle.append({
                    'id': getattr(ex_rel, 'id', None),
                    'examen_id': examen.id_examen if examen else None,
                    'nombre': examen.nombre if examen else 'N/A',
                    'tipo_examen': reg.tipo_examen,
                    'estado': None,
                    'resultado': None,
                    'fecha_envio': getattr(ex_rel, 'fecha_asignacion', None),
                    'fecha_completado': None
                })

            resultados.append({
                'id': reg.id,
                'uuid_trabajador': reg.uuid_trabajador,
                'nombre': reg.nombre_trabajador,
                'documento': reg.documento_trabajador,
                'empresa': reg.empresa.nombre_empresa if reg.empresa else None,
                'cargo': reg.cargo.nombrecargo if reg.cargo else None,
                'tipo_examen': reg.tipo_examen,
                'estado_trabajador': 'Completado' if reg.estado_trabajador == 1 else 'Pendiente',
                'examenes': examenes_detalle,
                'total_examenes': len(examenes_detalle),
                'examenes_completados': (len(examenes_detalle) if reg.estado_trabajador == 1 else 0),
                'examenes_pendientes': (0 if reg.estado_trabajador == 1 else len(examenes_detalle))
            })

        response_data = {
            'tipo_examen': tipo_examen,
            'tipos_validos': TIPOS_EXAMEN_VALIDOS,
            'total': len(resultados),
            'registros': resultados
        }
        
        # Guardar en cache (5 minutos)
        cache.set(cache_key, response_data, timeout=300)

        return Response(response_data, status=status.HTTP_200_OK, headers={'X-Cache': 'MISS'})


class ActualizarEstadoExamenesMasivoView(APIView):
    permission_classes = [IsAuthenticated, IsUsuarioEspecial | IsSuperAdmin]

    def patch(self, request):
        serializer = ActualizarEstadoExamenesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        trabajador_ids = serializer.validated_data['trabajador_ids']

        from .models import RegistroExamenes
        actualizados = []
        no_encontrados = []
        cambios = []
        for tid in trabajador_ids:
            try:
                reg = RegistroExamenes.objects.get(id=tid)
                estado_anterior = reg.estado_trabajador
                reg.estado_trabajador = 0 if reg.estado_trabajador == 1 else 1
                reg.save()

                # No sincronizamos RegistroExamenesEnviados: el estado del trabajador
                # es ahora la fuente de verdad (decoupled). Solo registramos el cambio
                actualizados.append(tid)
                cambios.append({'id': tid, 'de': estado_anterior, 'a': reg.estado_trabajador})

                # Invalidar cache de listados del correo para reflejar el cambio
                try:
                    correo_id = reg.correo_lote.id
                    for sz in (10, 25, 50, 100):
                        cache.delete(f"trabajadores_correo_v2={correo_id}_page=1_size={sz}")
                except Exception:
                    pass
            except RegistroExamenes.DoesNotExist:
                no_encontrados.append(tid)

        return Response({
            'actualizados': actualizados,
            'no_encontrados': no_encontrados,
            'cambios': cambios
        }, status=status.HTTP_200_OK)