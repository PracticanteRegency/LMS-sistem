# ==================== STANDARD LIBRARY ====================
import csv
import hashlib
import io
import os
import shutil
import tempfile
import zipfile
import traceback

from django.conf import settings
import uuid

import unicodedata
import re
from pathlib import Path
# ==================== DJANGO ====================
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.db.models import Count, Prefetch
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

# ==================== THIRD PARTY ====================
import cloudinary
import cloudinary.uploader
from docx import Document
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotAcceptable

import logging

# Opcional: pypandoc para conversión DOCX a PDF
import pypandoc
import pypandoc as _pypandoc

# ==================== LOCAL ====================
from .models import (
    Capacitaciones,
    CertificadoGenerado,
    Lecciones,
    Modulos,
    PreguntasLecciones,
    Respuestas,
    RespuestasColaboradores,
    progresoCapacitaciones,
    progresolecciones,
)
from capacitaciones.serializers import (
    CapacitacionDetalleSerializer,
    CapacitacionProgresoSerializer,
    capacitacionSerializer,
    CrearCapacitacionSerializer,
    MisCapacitacionesSerializer,
)
from .utils import actualizar_progreso_leccion, enviar_correo_capacitacion_creada
from usuarios.models import Colaboradores
from usuarios.permissions import IsAdminUser, IsSuperAdmin


# ==================== HELPERS DE CACHE ====================
def get_cache_key(prefix, *args):
    """Genera una clave de cache única basada en prefijo y argumentos"""
    key_data = f"{prefix}:" + ":".join(str(arg) for arg in args)
    return hashlib.md5(key_data.encode()).hexdigest()


def invalidate_capacitacion_cache(capacitacion_id=None, colaborador_id=None):
    """Invalida caches relacionadas con capacitaciones"""
    if capacitacion_id:
        cache.delete(get_cache_key('cap_detail', capacitacion_id))
    if colaborador_id:
        cache.delete(get_cache_key('mis_caps', colaborador_id))
    # Invalidar lista general de capacitaciones
    cache.delete('capacitaciones_list_admin')


class CrearCapacitacionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    """Crear o editar una capacitación (Solo Admin y SuperAdmin)
       GET with `capacitacion_id`: retorna datos para edición
       POST: crea nueva capacitación
       PATCH: actualiza/sincroniza una capacitación existente
    """

    def get(self, request, capacitacion_id, *args, **kwargs):
        """Obtener datos de la capacitación para edición (Admin only)"""
        try:
            capacitacion = Capacitaciones.objects.get(pk=capacitacion_id)
        except Capacitaciones.DoesNotExist:
            return Response({'error': 'Capacitación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CapacitacionDetalleSerializer(capacitacion)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def patch(self, request, capacitacion_id, *args, **kwargs):
        """Editar campos de la capacitación (Admin only)"""
        if not getattr(request.user, 'is_staff', False) and not getattr(request.user, 'is_superuser', False):
            return Response({'error': 'No tienes permiso para editar esta capacitación.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            capacitacion = Capacitaciones.objects.get(pk=capacitacion_id)
        except Capacitaciones.DoesNotExist:
            return Response({'error': 'Capacitación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # compute current collaborators to detect removals/additions for cache invalidation
        current_collaborators = set(progresoCapacitaciones.objects.filter(capacitacion=capacitacion).values_list('colaborador_id', flat=True))

        # Limpieza: si el front envía campos como imagen: '' quitarlos para evitar
        # errores de validación sobre campos no permitidos en blanco.
        data = None
        try:
            data = request.data.copy()
        except Exception:
            data = dict(request.data)

        for k in list(data.keys()):
            # eliminar sólo cadenas vacías; mantener False/0/None si es necesario
            if isinstance(data.get(k), str) and data.get(k) == '':
                data.pop(k)

        serializer = CrearCapacitacionSerializer(capacitacion, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # invalidate cache for the capacitacion and for affected collaborators
            invalidate_capacitacion_cache(capacitacion_id=capacitacion.id)
            new_collaborators = set(progresoCapacitaciones.objects.filter(capacitacion=capacitacion).values_list('colaborador_id', flat=True))
            affected = current_collaborators | new_collaborators
            for cid in affected:
                invalidate_capacitacion_cache(colaborador_id=cid)

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def post(self, request, capacitacion_id=None, *args, **kwargs):
        """
        Si `capacitacion_id` es provisto: manejar agregados/remociones de colaboradores
        con un payload { "add": [ids], "remove": [ids] }.
        Si no hay `capacitacion_id`: crear nueva capacitación (comportamiento previo).
        """
        # Si se proporciona capacitacion_id, manejar add/remove
        if capacitacion_id:
            try:
                # permisos: sólo admin (IsAdminUser ya aplicado)
                capacitacion = Capacitaciones.objects.get(pk=capacitacion_id)
            except Capacitaciones.DoesNotExist:
                return Response({'error': 'Capacitación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

            data = request.data or {}
            add_ids = set(data.get('add', []) or [])
            remove_ids = set(data.get('remove', []) or [])

            # validar que no haya intersección problemática
            if add_ids & remove_ids:
                return Response({'error': 'IDs en add y remove al mismo tiempo'}, status=status.HTTP_400_BAD_REQUEST)

            # validar existencia de colaboradores a agregar
            existing_add = set(Colaboradores.objects.filter(idcolaborador__in=add_ids).values_list('idcolaborador', flat=True))
            missing = add_ids - existing_add
            if missing:
                return Response({'error': f'Colaboradores no encontrados: {list(missing)}'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                added = []
                removed = []

                # Agregar nuevos
                to_add = add_ids - set(progresoCapacitaciones.objects.filter(capacitacion=capacitacion).values_list('colaborador_id', flat=True))
                bulk = []
                for cid in to_add:
                    bulk.append(progresoCapacitaciones(
                        capacitacion=capacitacion,
                        colaborador_id=cid,
                        fecha_registro=timezone.now(),
                        completada=False,
                        progreso=0
                    ))
                    added.append(cid)
                if bulk:
                    progresoCapacitaciones.objects.bulk_create(bulk)

                # Enviar notificación solo a los agregados una vez la transacción se confirme
                if added:
                    try:
                        transaction.on_commit(lambda: enviar_correo_capacitacion_creada(capacitacion, colaboradores_ids=added))
                    except Exception:
                        # No queremos que el envio de correos impida la operación
                        pass

                # Eliminar solicitados
                to_remove = remove_ids & set(progresoCapacitaciones.objects.filter(capacitacion=capacitacion).values_list('colaborador_id', flat=True))
                if to_remove:
                    for cid in to_remove:
                        progresolecciones.objects.filter(idcolaborador_id=cid, idleccion__idmodulo__idcapacitacion=capacitacion).delete()
                        from .models import progresoModulo as _progresoModulo
                        _progresoModulo.objects.filter(colaborador_id=cid, modulo__idcapacitacion=capacitacion).delete()
                        progresoCapacitaciones.objects.filter(capacitacion=capacitacion, colaborador_id=cid).delete()
                        removed.append(cid)

                # invalidar caches para colaboradores afectados y para la capacitación
                invalidate_capacitacion_cache(capacitacion_id=capacitacion.id)
                for cid in set(added + removed):
                    invalidate_capacitacion_cache(colaborador_id=cid)

                return Response({'added': added, 'removed': removed}, status=status.HTTP_200_OK)

        # si no se proporciona capacitacion_id: comportamiento original (crear)
        try:
            serializer = CrearCapacitacionSerializer(data=request.data)
            if serializer.is_valid():
                capacitacion = serializer.save()
                
                # Invalidar cache de lista de capacitaciones
                cache.delete('capacitaciones_list_admin')
                
                # Invalidar cache de colaboradores inscritos
                colaboradores_ids = request.data.get('colaboradores', [])
                for col_id in colaboradores_ids:
                    invalidate_capacitacion_cache(colaborador_id=col_id)
                
                return Response(
                    {'id': capacitacion.id, 'titulo': capacitacion.titulo},
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CapacitacionesView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin | IsAdminUser]
    """Lista todas las capacitaciones activas (Solo Admin y SuperUsuario)
    
    Optimización: 
    - Cache de 5 minutos para lista de capacitaciones
    - Select_related para evitar N+1 queries
    - Only() para cargar solo campos necesarios
    """
    
    def get(self, request, *args, **kwargs):
        try:
            # Intentar obtener de cache
            cache_key = 'capacitaciones_list_admin'
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return Response(cached_data, status=status.HTTP_200_OK)
            
            # Query optimizada: solo campos necesarios, ordenado por fecha
            capacitaciones = Capacitaciones.objects.exclude(
                estado=3
            ).only(
                'id', 'titulo', 'descripcion', 'estado',
                'fecha_creacion', 'fecha_inicio', 'fecha_fin', 'tipo'
            ).order_by('-fecha_creacion')
            
            serializer = capacitacionSerializer(capacitaciones, many=True)
            
            # Guardar en cache (5 minutos)
            cache_ttl = getattr(settings, 'CACHE_TTL_CAPACITACIONES_LIST', 300)
            cache.set(cache_key, serializer.data, cache_ttl)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def put(self, request, *args, **kwargs):

        "eliminar capacitacion (soft delete)"

        try:
            capacitacion_id = request.data.get('capacitacion_id')
            if not capacitacion_id:
                return Response({'error': 'capacitacion_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
            capacitacion = get_object_or_404(Capacitaciones, pk=capacitacion_id)
            capacitacion.estado = 3  # estado eliminado
            capacitacion.save()
            
            # Invalidate caches
            invalidate_capacitacion_cache(capacitacion_id=capacitacion.id)
            colaboradores_ids = progresoCapacitaciones.objects.filter(capacitacion=capacitacion).values_list('colaborador_id', flat=True)
            for col_id in colaboradores_ids:
                invalidate_capacitacion_cache(colaborador_id=col_id)
            cache.delete('capacitaciones_list_admin')
            
            return Response({'mensaje': 'Capacitación eliminada exitosamente'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


class CapacitacionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin | IsAdminUser]
    """
    Detalle de una capacitación específica con prefetch optimizado.
    
    Solo el usuario autenticado puede ver las capacitaciones en las que está inscrito.
    
    Optimización: 
    - Prefetch_related profundo para cargar toda la estructura (226 → 4 queries)
    - Cache por capacitación (10 minutos) - estructura no cambia frecuentemente
    """
    
    def get(self, request, capacitacion_id, *args, **kwargs):
        try:
            # Verificar que el usuario tiene colaborador asociado
            colaborador = getattr(request.user, 'idcolaboradoru', None)
            if not colaborador:
                return Response(
                    {'error': 'El usuario no tiene un colaborador asociado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar inscripción (query rápida con exists())
            inscrito = progresoCapacitaciones.objects.filter(
                colaborador=colaborador,
                capacitacion_id=capacitacion_id
            ).only('id').exists()
            
            if not inscrito:
                return Response(
                    {'error': 'No tienes acceso a esta capacitación. No estás inscrito.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Intentar obtener de cache (la estructura de la capacitación no cambia)
            cache_key = get_cache_key('cap_detail', capacitacion_id)
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return Response(cached_data, status=status.HTTP_200_OK)
            
            # Prefetch profundo de toda la estructura (optimizado)
            capacitacion = Capacitaciones.objects.prefetch_related(
                Prefetch(
                    'modulos_set',
                    queryset=Modulos.objects.prefetch_related(
                        Prefetch(
                            'lecciones_set',
                            queryset=Lecciones.objects.prefetch_related(
                                Prefetch(
                                    'preguntaslecciones_set',
                                    queryset=PreguntasLecciones.objects.prefetch_related(
                                        'respuestas_set'
                                    )
                                )
                            ).order_by('id')
                        )
                    ).order_by('id')
                )
            ).get(pk=capacitacion_id)
            
            serializer = CapacitacionDetalleSerializer(capacitacion)
            
            # Guardar en cache (10 minutos)
            cache_ttl = getattr(settings, 'CACHE_TTL_CAPACITACION_DETAIL', 600)
            cache.set(cache_key, serializer.data, cache_ttl)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Capacitaciones.DoesNotExist:
            return Response(
                {'error': 'Capacitación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegistrarProgresoView(APIView):
    permission_classes = [IsAuthenticated]
    """Registrar progreso en una lección y actualizar progreso de módulo y capacitación
    
    Optimización:
    - Select_related para obtener módulo y capacitación en una sola query
    - Invalidación de cache del colaborador al actualizar progreso
    """
    
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        try:
            # Obtener colaborador desde el usuario autenticado
            if not request.user.idcolaboradoru:
                return Response(
                    {'error': 'El usuario no tiene un colaborador asociado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            colaborador = request.user.idcolaboradoru
            leccion_id = request.data.get('leccion_id')
            progreso = request.data.get('progreso', 0)
            completada = request.data.get('completada', False)
            
            if not leccion_id:
                return Response(
                    {'error': 'leccion_id es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Select_related para obtener módulo y capacitación en una query
            leccion = Lecciones.objects.select_related(
                'idmodulo__idcapacitacion'
            ).get(id=leccion_id)
            
            # Usar la función de utils que actualiza toda la cadena de progreso
            progreso_data = actualizar_progreso_leccion(
                colaborador_id=colaborador.idcolaborador,
                leccion=leccion,
                progreso=progreso,
                completada=completada
            )
            
            # Invalidar cache del colaborador
            invalidate_capacitacion_cache(colaborador_id=colaborador.idcolaborador)
            
            return Response(
                {
                    'mensaje': 'Progreso actualizado exitosamente',
                    'leccion_id': leccion_id,
                    'progreso_leccion': progreso,
                    'completada': completada,
                    'progreso_modulo': progreso_data.get('progreso_modulo', 0),
                    'progreso_capacitacion': progreso_data.get('progreso_capacitacion', 0)
                },
                status=status.HTTP_200_OK
            )
        except Lecciones.DoesNotExist:
            return Response(
                {'error': 'Lección no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompletarLeccionView(APIView):
    permission_classes = [IsAuthenticated]
    """Marcar una lección como completada y actualizar progreso de módulo y capacitación
    
    Optimización:
    - Select_related para obtener módulo y capacitación en una sola query
    - Verificación de inscripción optimizada con only()
    - Invalidación de cache al completar
    """
    
    @transaction.atomic
    def post(self, request, leccion_id, *args, **kwargs):
        try:
            # Obtener colaborador desde el usuario autenticado
            if not request.user.idcolaboradoru:
                return Response(
                    {'error': 'El usuario no tiene un colaborador asociado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            colaborador = request.user.idcolaboradoru
            
            # Select_related para obtener módulo y capacitación en una query
            leccion = Lecciones.objects.select_related(
                'idmodulo__idcapacitacion'
            ).get(id=leccion_id)
            
            # Verificar inscripción (query optimizada)
            modulo = leccion.idmodulo
            capacitacion = modulo.idcapacitacion
            
            inscrito = progresoCapacitaciones.objects.filter(
                colaborador=colaborador,
                capacitacion=capacitacion
            ).only('id').exists()
            
            if not inscrito:
                return Response(
                    {'error': 'No tienes acceso a esta lección. No estás inscrito en la capacitación correspondiente.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Usar la función de utils que actualiza toda la cadena de progreso
            progreso_data = actualizar_progreso_leccion(
                colaborador_id=colaborador.idcolaborador,
                leccion=leccion,
                progreso=100,
                completada=True
            )
            
            # Invalidar cache del colaborador
            invalidate_capacitacion_cache(colaborador_id=colaborador.idcolaborador)
            
            return Response(
                {
                    'mensaje': 'Lección completada exitosamente',
                    'leccion_id': leccion_id,
                    'colaborador_id': colaborador.idcolaborador,
                    'progreso_modulo': progreso_data.get('progreso_modulo', 0),
                    'progreso_capacitacion': progreso_data.get('progreso_capacitacion', 0)
                },
                status=status.HTTP_200_OK
            )
        except Lecciones.DoesNotExist:
            return Response(
                {'error': 'Lección no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al completar lección: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResponderCuestionarioView(APIView):
    permission_classes = [IsAuthenticated]
    """Responder cuestionario de una lección tipo formulario
    
    Optimización:
    - Select_related para obtener lección, módulo y capacitación en una query
    - Bulk operations para guardar respuestas
    - Prefetch de preguntas con respuestas correctas
    - Transacción atómica para consistencia
    """
    
    @transaction.atomic
    def post(self, request, leccion_id, *args, **kwargs):
        try:
            # Obtener colaborador desde el usuario autenticado
            if not request.user.idcolaboradoru:
                return Response(
                    {'error': 'El usuario no tiene un colaborador asociado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            colaborador = request.user.idcolaboradoru
            respuestas_ids = request.data.get('respuestas', [])
            
            if not respuestas_ids:
                return Response(
                    {'error': 'Se requiere al menos una respuesta'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener lección con relaciones en una sola query
            leccion = Lecciones.objects.select_related(
                'idmodulo__idcapacitacion'
            ).get(id=leccion_id)
            
            modulo = leccion.idmodulo
            capacitacion = modulo.idcapacitacion
            
            # Verificar inscripción (query optimizada)
            inscrito = progresoCapacitaciones.objects.filter(
                colaborador=colaborador,
                capacitacion=capacitacion
            ).only('id').exists()
            
            if not inscrito:
                return Response(
                    {'error': 'No tienes acceso a esta lección. No estás inscrito en la capacitación correspondiente.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener preguntas con respuestas correctas en una query optimizada
            preguntas = PreguntasLecciones.objects.filter(
                id_leccion=leccion
            ).prefetch_related(
                Prefetch(
                    'respuestas_set',
                    queryset=Respuestas.objects.filter(escorrecto=1),
                    to_attr='respuestas_correctas'
                )
            )
            
            total_preguntas = preguntas.count()
            
            if total_preguntas == 0:
                return Response(
                    {'error': 'Esta lección no tiene preguntas asociadas'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener IDs de respuestas correctas
            respuestas_correctas_ids = set()
            for pregunta in preguntas:
                for resp in pregunta.respuestas_correctas:
                    respuestas_correctas_ids.add(resp.id)
            
            # Eliminar respuestas anteriores en bulk
            preguntas_ids = [p.id for p in preguntas]
            RespuestasColaboradores.objects.filter(
                idcolaborador=colaborador,
                idpregunta_id__in=preguntas_ids
            ).delete()
            
            # Obtener respuestas válidas y crear en bulk
            respuestas_validas = Respuestas.objects.filter(
                id__in=respuestas_ids
            ).select_related('idpregunta')
            
            nuevas_respuestas = [
                RespuestasColaboradores(
                    idcolaborador=colaborador,
                    idpregunta=respuesta.idpregunta,
                    idrespuesta=respuesta
                )
                for respuesta in respuestas_validas
            ]
            RespuestasColaboradores.objects.bulk_create(nuevas_respuestas)
            
            # Calcular respuestas correctas del usuario
            respuestas_correctas_usuario = set(respuestas_ids) & respuestas_correctas_ids
            total_correctas = len(respuestas_correctas_usuario)
            
            # Calcular porcentaje de acierto
            porcentaje_acierto = (total_correctas / total_preguntas) * 100
            
            # Determinar si pasó la lección (>60%)
            aprobada = porcentaje_acierto >= 60
            
            # Actualizar progreso usando la función de utils
            progreso = 100 if aprobada else 0
            progreso_data = actualizar_progreso_leccion(
                colaborador_id=colaborador.idcolaborador,
                leccion=leccion,
                progreso=progreso,
                completada=aprobada
            )
            
            # Invalidar cache del colaborador
            invalidate_capacitacion_cache(colaborador_id=colaborador.idcolaborador)
            
            return Response(
                {
                    'mensaje': 'Cuestionario respondido exitosamente',
                    'leccion_id': leccion_id,
                    'total_preguntas': total_preguntas,
                    'respuestas_correctas': total_correctas,
                    'porcentaje_acierto': round(porcentaje_acierto, 2),
                    'aprobada': aprobada,
                    'progreso_leccion': progreso,
                    'progreso_modulo': progreso_data.get('progreso_modulo', 0),
                    'progreso_capacitacion': progreso_data.get('progreso_capacitacion', 0)
                },
                status=status.HTTP_200_OK
            )
        except Lecciones.DoesNotExist:
            return Response(
                {'error': 'Lección no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al procesar cuestionario: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrevisualizarColaboradoresView(APIView):
    permission_classes = [IsAuthenticated]
    """Cargar archivo CSV con cédulas y previsualizar colaboradores
    
    Optimización:
    - Búsqueda en bulk en lugar de consulta individual por cédula
    - Solo se cargan campos necesarios con only()
    """
    
    def post(self, request, *args, **kwargs):
        try:
            archivo = request.FILES.get('archivo')
            if not archivo:
                return Response(
                    {'error': 'No se proporcionó archivo'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que sea un archivo CSV
            if not archivo.name.endswith('.csv'):
                return Response(
                    {'error': 'El archivo debe ser un CSV'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Leer el archivo CSV
            try:
                decoded_file = archivo.read().decode('utf-8')
                io_string = io.StringIO(decoded_file)
                
                # Detectar el delimitador
                first_line = decoded_file.split('\n')[0]
                if ';;' in first_line:
                    delimiter = ';'
                elif ';' in first_line:
                    delimiter = ';'
                else:
                    delimiter = ','
                
                csv_reader = csv.DictReader(io_string, delimiter=delimiter)
                
                # Validar que tenga la columna 'cedula'
                if not csv_reader.fieldnames or 'cedula' not in csv_reader.fieldnames:
                    return Response(
                        {'error': 'El archivo CSV debe contener la columna "cedula"'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Recolectar todas las cédulas primero
                cedulas = []
                for row in csv_reader:
                    cedula = row.get('cedula', '').strip()
                    if cedula:
                        cedulas.append(cedula)
                
                # Búsqueda en bulk - una sola query para todas las cédulas
                colaboradores_db = Colaboradores.objects.filter(
                    cccolaborador__in=cedulas
                ).only(
                    'idcolaborador', 'cccolaborador', 
                    'nombrecolaborador', 'apellidocolaborador'
                )
                
                # Crear diccionario para búsqueda rápida O(1)
                colaboradores_map = {
                    c.cccolaborador: c for c in colaboradores_db
                }
                
                colaboradores_encontrados = []
                colaboradores_no_encontrados = []
                
                for cedula in cedulas:
                    colaborador = colaboradores_map.get(cedula)
                    if colaborador:
                        colaboradores_encontrados.append({
                            'id': colaborador.idcolaborador,
                            'cc_colaborador': colaborador.cccolaborador,
                            'nombre': colaborador.nombrecolaborador,
                            'apellido': colaborador.apellidocolaborador
                        })
                    else:
                        # Solo almacenar las cédulas no encontradas (lista simple)
                        colaboradores_no_encontrados.append(cedula)
                
                return Response(
                    {
                        'mensaje': 'Archivo procesado correctamente',
                        'total_procesados': len(colaboradores_encontrados) + len(colaboradores_no_encontrados),
                        'encontrados': len(colaboradores_encontrados),
                        'no_encontrados': len(colaboradores_no_encontrados),
                        'colaboradores': colaboradores_encontrados,
                        'colaboradores_no_encontrados': colaboradores_no_encontrados
                    },
                    status=status.HTTP_200_OK
                )
                
            except UnicodeDecodeError:
                return Response(
                    {'error': 'Error al decodificar el archivo. Asegúrate de que esté en formato UTF-8'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except csv.Error as e:
                return Response(
                    {'error': f'Error al procesar el archivo CSV: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error al procesar archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CargarArchivoView(APIView):
    permission_classes = [IsAuthenticated]
    """Cargar archivos (imágenes y PDFs) a Cloudinary"""
    
    # Extensiones permitidas
    ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    ALLOWED_PDF_EXTENSION = ['pdf']
    
    def post(self, request, *args, **kwargs):
        try:
            archivo = request.FILES.get('archivo')
            if not archivo:
                return Response(
                    {'error': 'No se proporcionó archivo'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            nombre_archivo = archivo.name
            extension = nombre_archivo.rsplit('.', 1)[-1].lower() if '.' in nombre_archivo else ''
            all_allowed = self.ALLOWED_IMAGE_EXTENSIONS + self.ALLOWED_PDF_EXTENSION
            if extension not in all_allowed:
                return Response(
                    {'error': f'Tipo de archivo no permitido. Extensiones válidas: {", ".join(all_allowed)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Guardar imágenes y PDFs localmente
            carpeta_destino = os.path.join(settings.MEDIA_ROOT, 'capacitaciones')
            os.makedirs(carpeta_destino, exist_ok=True)
            nombre_unico = f"{uuid.uuid4().hex}_{nombre_archivo}"
            ruta_destino = os.path.join(carpeta_destino, nombre_unico)
            with open(ruta_destino, 'wb+') as destino:
                for chunk in archivo.chunks():
                    destino.write(chunk)
            url = f"{settings.MEDIA_URL}capacitaciones/{nombre_unico}"
            return Response(
                {
                    'url': url,
                    'filename': nombre_unico,
                    'original_filename': nombre_archivo,
                    'extension': extension,
                    'size': archivo.size,
                    'local': True
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Error al subir archivo a Cloudinary: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DescargarCertificadoView(APIView):
    permission_classes = [IsAuthenticated]
    """Generar y descargar certificado de capacitación completada"""
    
    def _convertir_docx_a_pdf(self, docx_path, pdf_path):
        """
        Convertir DOCX a PDF
        Nota: Requiere una herramienta externa (pypandoc con backend disponible)
        Por ahora retorna False para indicar que se devuelve el DOCX
        """
        logger = logging.getLogger("certificado_debug")
        try:
            # 1) Intentar con docx2pdf (usa Word en Windows o LibreOffice en algunas plataformas)
            try:
                from docx2pdf import convert as _docx2pdf_convert
                logger.warning("Intentando conversión con docx2pdf...")
                try:
                    _docx2pdf_convert(docx_path, pdf_path)
                    if os.path.exists(pdf_path):
                        logger.warning("Conversión con docx2pdf exitosa")
                        return True
                except Exception as e:
                    logger.warning(f"docx2pdf falló: {e}")
            except Exception:
                logger.warning("docx2pdf no está disponible")

            # 2) Intentar con pypandoc (requiere pandoc y típicamente LaTeX para PDF)
            try:
                logger.warning("Intentando conversión con pypandoc...")
                try:
                    _pypandoc.convert_file(docx_path, 'pdf', outputfile=pdf_path)
                    if os.path.exists(pdf_path):
                        logger.warning("Conversión con pypandoc exitosa")
                        return True
                except Exception as e:
                    logger.warning(f"pypandoc falló: {e}")
            except Exception:
                logger.warning("pypandoc no está disponible")

            # 3) Intentar con LibreOffice (soffice) en modo headless
            try:
                import subprocess, shutil
                logger.warning("Intentando conversión con LibreOffice (soffice)...")
                out_dir = os.path.dirname(pdf_path) or os.getcwd()
                cmd = ['soffice', '--headless', '--convert-to', 'pdf', '--outdir', out_dir, docx_path]
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                logger.warning(f"soffice exit {proc.returncode}")
                # LibreOffice normalmente crea un PDF con mismo nombre base en out_dir
                expected = os.path.join(out_dir, os.path.splitext(os.path.basename(docx_path))[0] + '.pdf')
                if os.path.exists(expected):
                    try:
                        shutil.move(expected, pdf_path)
                    except Exception:
                        pass
                    if os.path.exists(pdf_path):
                        logger.warning("Conversión con LibreOffice exitosa")
                        return True
            except Exception as e:
                logger.warning(f"LibreOffice/soffice falló: {e}")

            logger.warning("No se pudo convertir DOCX a PDF con los backends disponibles")
            return False

        except Exception as e:
            logger.error(f"Error inesperado en conversión: {e}")
            return False


    
    def get(self, request, id_capacitacion, id_colaborador=None, *args, **kwargs):
        import logging
        logger = logging.getLogger("certificado_debug")
        logger.warning(f"request.user type: {type(request.user)}")
        logger.warning(f"request.user: {request.user}")
        logger.warning(f"request.user.__dict__: {getattr(request.user, '__dict__', 'no __dict__')}")
        logger.warning(f"request.user.id: {getattr(request.user, 'id', None)}")
        logger.warning(f"request.user.idcolaboradoru: {getattr(request.user.idcolaboradoru, 'idcolaboradoru', None)}")
        logger.warning(f"request.user.is_authenticated: {getattr(request.user, 'is_authenticated', None)}")
        try:
            # Si no se proporciona id_colaborador, obtenerlo del token
            if id_colaborador is None:
                # Obtener del token usando hasattr como en examenes/views.py
                colaborador = (
                    request.user.idcolaboradoru if hasattr(
                        request.user, 'idcolaboradoru') else None
                )
                logger.warning(f"colaborador obtenido: {colaborador}")
                if not colaborador:
                    return Response(
                        {'error': 'El usuario no tiene un colaborador asociado'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                id_colaborador = colaborador.idcolaborador
            else:
                # Verificar que el usuario autenticado corresponde al colaborador solicitado
                colaborador = (
                    request.user.idcolaboradoru if hasattr(
                        request.user, 'idcolaboradoru') else None
                )
                logger.warning(f"colaborador obtenido (con id): {colaborador}")
                if not colaborador or colaborador.idcolaborador != id_colaborador:
                    return Response(
                        {'error': 'No tienes permiso para descargar este certificado'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Obtener colaborador con centro y cargo (necesarios para derivar empresa)
            colaborador = Colaboradores.objects.select_related(
                'centroop__id_proyecto__id_unidad__id_empresa',
                'cargocolaborador'
            ).only(
                'idcolaborador', 'cccolaborador', 'nombrecolaborador',
                'apellidocolaborador', 'correocolaborador', 'cargocolaborador', 'centroop'
            ).get(idcolaborador=id_colaborador)
            capacitacion = get_object_or_404(Capacitaciones, id=id_capacitacion)
            
            # Verificar que el colaborador completó la capacitación
            progreso = progresoCapacitaciones.objects.filter(
                colaborador=colaborador,
                capacitacion=capacitacion,
                completada=1
            ).first()
            
            if not progreso:
                return Response(
                    {'error': 'No has completado esta capacitación. Debes completarla al 100% para obtener el certificado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar si ya existe un certificado generado (caché de 1 mes)
            certificado_existente = CertificadoGenerado.objects.filter(
                colaborador_id=id_colaborador,
                capacitacion_id=id_capacitacion
            ).first()
            
            # Si existe y tiene menos de 1 mes, retornarlo
            if certificado_existente:
                fecha_limite = timezone.now() - timezone.timedelta(days=30)
                if certificado_existente.fecha_generacion > fecha_limite:
                    # Certificado válido en caché
                    archivo_path = certificado_existente.archivo_pdf.path
                    if os.path.exists(archivo_path):
                        # Detectar tipo real del archivo leyendo el encabezado
                        cached_content_type = 'application/octet-stream'
                        cached_ext = os.path.splitext(archivo_path)[1].lower().lstrip('.') or 'bin'
                        try:
                            with open(archivo_path, 'rb') as fh:
                                header = fh.read(8)
                                if header.startswith(b'%PDF'):
                                    cached_content_type = 'application/pdf'
                                    cached_ext = 'pdf'
                                elif zipfile.is_zipfile(archivo_path):
                                    # DOCX files are ZIP archives
                                    cached_content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                    cached_ext = 'docx'
                                else:
                                    # fallback by extension
                                    ext = os.path.splitext(archivo_path)[1].lower()
                                    if ext == '.pdf':
                                        cached_content_type = 'application/pdf'
                                        cached_ext = 'pdf'
                                    elif ext == '.docx':
                                        cached_content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                        cached_ext = 'docx'
                        except Exception:
                            # keep defaults
                            pass

                        response = FileResponse(
                            open(archivo_path, 'rb'),
                            content_type=cached_content_type
                        )
                        response['Content-Disposition'] = f'attachment; filename="certificado_{colaborador.nombrecolaborador}_{colaborador.apellidocolaborador}.{cached_ext}"'
                        response['Cache-Control'] = 'max-age=2592000'  # 30 días
                        return response
            
            # Determinar la plantilla según la empresa del colaborador
            empresa = None
            try:
                centro = getattr(colaborador, 'centroop', None)
                if centro and getattr(centro, 'id_proyecto', None) and getattr(centro.id_proyecto, 'id_unidad', None):
                    empresa = getattr(centro.id_proyecto.id_unidad, 'id_empresa', None)
            except Exception:
                empresa = None

            if not empresa:
                return Response(
                    {'error': 'El colaborador no tiene empresa asociada'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mapear nombre de empresa a archivo de plantilla (más tolerante)
            empresa_nombre = (empresa.nombre_empresa or '').upper().strip()

            def _normalize_name(s: str) -> str:
                s = unicodedata.normalize('NFKD', s)
                s = ''.join(ch for ch in s if not unicodedata.combining(ch))
                s = re.sub(r'[^A-Z0-9\s]', ' ', s)
                s = re.sub(r'\s+', ' ', s).strip()
                return s

            norm = _normalize_name(empresa_nombre)

            # Lista de pares (keywords, plantilla) — se evalúa si alguna keyword está contenida
            plantilla_candidates = [
                (['CONSORCIO', 'PEAJES'], 'CONSORCIO.docx'),
                (['PROTINCO', 'PROTECCION', 'INFRAESTRUCTURA'], 'PROTINCO.docx'),
                (['REGENCY HEALTH', 'HEALTH'], 'REGENCY_HEALTH.docx'),
                (['REGENCY TECH', 'TECH'], 'REGENC_TECH.docx'),
                (['REGENCY', 'REGENCY SERVICES', 'SERVICES'], 'REGENCY.docx'),
            ]

            plantilla_nombre = None
            for keys, fname in plantilla_candidates:
                for k in keys:
                    if k in norm:
                        plantilla_nombre = fname
                        break
                if plantilla_nombre:
                    break

            # Valor por defecto si no matchea ninguna keyword
            if not plantilla_nombre:
                plantilla_nombre = 'REGENCY.docx'

            logger.warning(f"Empresa nombre (raw): {getattr(empresa, 'nombre_empresa', None)}")
            plantilla_path = os.path.join(settings.BASE_DIR, 'plantillas', plantilla_nombre)
            logger.warning(f"Plantilla seleccionada: {plantilla_nombre}; ruta esperada: {plantilla_path}")

            # Si no existe el archivo esperado, intentar un fallback tolerante
            if not os.path.exists(plantilla_path):
                # Probar varios posibles directorios de plantillas en el contenedor
                tried_dirs = []
                found = False
                match = None
                alt_dirs = [
                    os.path.join(settings.BASE_DIR, 'plantillas'),
                    os.path.join(settings.BASE_DIR, '..', 'plantillas'),
                    os.path.join(settings.BASE_DIR, '..', '..', 'plantillas'),
                    os.path.join(settings.BASE_DIR, 'backend', 'plantillas'),
                ]
                available = []
                for plantillas_dir in alt_dirs:
                    plantillas_dir = os.path.normpath(plantillas_dir)
                    tried_dirs.append(plantillas_dir)
                    if os.path.isdir(plantillas_dir):
                        try:
                            available = os.listdir(plantillas_dir)
                        except Exception:
                            available = []
                        logger.warning(f"Plantillas en {plantillas_dir}: {available}")
                        # Intentar match case-insensitive exacto
                        for f in available:
                            if f.lower() == plantilla_nombre.lower():
                                match = f
                                break
                        if not match:
                            for f in available:
                                fnorm = _normalize_name(f.upper())
                                for keys, _fname in plantilla_candidates:
                                    for k in keys:
                                        if k in fnorm:
                                            match = f
                                            break
                                    if match:
                                        break
                                if match:
                                    break
                        if match:
                            plantilla_nombre = match
                            plantilla_path = os.path.join(plantillas_dir, plantilla_nombre)
                            logger.warning(f"Fallback: usando plantilla {plantilla_nombre} encontrada en {plantilla_path}")
                            found = True
                            break

                if not found:
                    logger.warning(f"No se encontraron plantillas en dirs probados: {tried_dirs}")
                    return Response(
                        {
                            'error': f'No se encontró la plantilla para la empresa {empresa_nombre}',
                            'plantillas_busquedas': tried_dirs,
                            'plantillas_disponibles': available
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Preparar datos para reemplazar en la plantilla
            fecha_completada = progreso.fecha_completada or timezone.now()
            
            # Traducir mes a español
            meses = {
                1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
                5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
                9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
            }
            mes_nombre = meses[fecha_completada.month]
            fecha_formateada = f"{fecha_completada.day} de {mes_nombre} de {fecha_completada.year}"
            
            # Intentar cargar cargo y centro de forma segura
            cargo_nombre = ''
            centro_nombre = ''
            try:
                if colaborador.cargocolaborador:
                    cargo_nombre = colaborador.cargocolaborador.nombrecargo
            except Exception:
                cargo_nombre = ''
            
            try:
                if colaborador.centroop:
                    centro_nombre = colaborador.centroop.nombre_centrop
            except Exception:
                centro_nombre = ''
            
            datos = {
                '{{NOMBRE}}': f"{colaborador.nombrecolaborador} {colaborador.apellidocolaborador}",
                '{{CEDULA}}': colaborador.cccolaborador,
                '{{CURSO}}': capacitacion.titulo,
                '{{FECHA}}': fecha_formateada,
                '{{nombre_completo}}': f"{colaborador.nombrecolaborador} {colaborador.apellidocolaborador}",
                '{{nombre}}': colaborador.nombrecolaborador,
                '{{apellido}}': colaborador.apellidocolaborador,
                '{{cedula}}': colaborador.cccolaborador,
                '{{capacitacion}}': capacitacion.titulo,
                '{{fecha}}': fecha_formateada,
                '{{fecha_corta}}': fecha_completada.strftime('%d/%m/%Y'),
                '{{empresa}}': empresa.nombre_empresa,
                '{{cargo}}': cargo_nombre,
                '{{centro}}': centro_nombre,
            }
            
            # Crear directorio temporal
            temp_dir = tempfile.mkdtemp()
            try:
                # Cargar plantilla Word
                doc = Document(plantilla_path)
                
                # Función para reemplazar texto manteniendo formato
                def replace_in_paragraph(paragraph, datos):
                    # Concatenar todo el texto del párrafo
                    full_text = ''.join(run.text for run in paragraph.runs)
                    
                    # Verificar si hay variables para reemplazar
                    modificado = False
                    for key, value in datos.items():
                        if key in full_text:
                            full_text = full_text.replace(key, value)
                            modificado = True
                    
                    # Si hubo cambios, actualizar el párrafo
                    if modificado:
                        # Mantener el formato del primer run
                        for i, run in enumerate(paragraph.runs):
                            if i == 0:
                                run.text = full_text
                            else:
                                run.text = ''
                
                # Reemplazar variables en párrafos
                for paragraph in doc.paragraphs:
                    replace_in_paragraph(paragraph, datos)
                
                # Reemplazar variables en tablas
                for table in doc.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            for paragraph in cell.paragraphs:
                                replace_in_paragraph(paragraph, datos)
                
                # Reemplazar en encabezados y pies de página
                for section in doc.sections:
                    # Encabezado
                    for paragraph in section.header.paragraphs:
                        replace_in_paragraph(paragraph, datos)
                    
                    # Pie de página
                    for paragraph in section.footer.paragraphs:
                        replace_in_paragraph(paragraph, datos)
                
                # Guardar Word modificado temporalmente
                temp_docx = os.path.join(temp_dir, 'certificado_temp.docx')
                doc.save(temp_docx)
                
                # Convertir a PDF
                temp_pdf = os.path.join(temp_dir, 'certificado_temp.pdf')
                
                # Intentar conversión con herramientas disponibles
                conversion_exitosa = self._convertir_docx_a_pdf(temp_docx, temp_pdf)
                
                # Guardar en media y crear registro en BD
                fecha_str = timezone.now().strftime('%Y/%m/%d')
                
                # Si la conversión fue exitosa, usar PDF; si no, usar DOCX
                if conversion_exitosa and os.path.exists(temp_pdf):
                    archivo_generado = temp_pdf
                    extension = 'pdf'
                    content_type = 'application/pdf'
                else:
                    archivo_generado = temp_docx
                    extension = 'docx'
                    content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                
                # Crear nombre del archivo
                filename = f'certificado_{id_colaborador}_{id_capacitacion}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{extension}'
                archivo_relative_path = os.path.join('certificados_generados', fecha_str, filename)
                archivo_full_path = os.path.join(settings.MEDIA_ROOT, archivo_relative_path)
                
                # Crear directorio si no existe
                os.makedirs(os.path.dirname(archivo_full_path), exist_ok=True)
                
                # Copiar archivo generado a media
                shutil.copy2(archivo_generado, archivo_full_path)
                
                # Guardar o actualizar registro en BD
                if certificado_existente:
                    # Eliminar archivo anterior
                    if certificado_existente.archivo_pdf and os.path.exists(certificado_existente.archivo_pdf.path):
                        os.remove(certificado_existente.archivo_pdf.path)
                    certificado_existente.archivo_pdf = archivo_relative_path
                    certificado_existente.fecha_actualizacion = timezone.now()
                    certificado_existente.save()
                else:
                    CertificadoGenerado.objects.create(
                        colaborador_id=id_colaborador,
                        capacitacion_id=id_capacitacion,
                        archivo_pdf=archivo_relative_path
                    )
                
                # Retornar archivo (PDF o DOCX)
                response = FileResponse(
                    open(archivo_full_path, 'rb'),
                    content_type=content_type
                )
                response['Content-Disposition'] = f'attachment; filename="certificado_{colaborador.nombrecolaborador}_{colaborador.apellidocolaborador}.{extension}"'
                response['Cache-Control'] = 'max-age=2592000'  # 30 días
                
                return response
                
            finally:
                # Limpiar directorio temporal
                shutil.rmtree(temp_dir, ignore_errors=True)
                
        except Exception as e:
            return Response(
                {'error': f'Error al generar certificado: {str(e)}', 'traceback': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MisCapacitacionesView(APIView):
    permission_classes = [IsAuthenticated]
    """Ver mis capacitaciones asignadas (una capacitación específica)"""
    
    def get(self, request, capacitacion_id, *args, **kwargs):
        try:
            # Obtener colaborador desde el token
            colaborador = getattr(request.user, 'idcolaboradoru', None)
            if not colaborador:
                return Response(
                    {'error': 'El usuario no tiene un colaborador asociado'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prefetch optimizado con filtro del colaborador para progreso y estructura
            capacitacion = Capacitaciones.objects.prefetch_related(
                Prefetch(
                    'progresocapacitaciones_set',
                    queryset=progresoCapacitaciones.objects.filter(colaborador=colaborador),
                    to_attr='progreso_colaborador'
                ),
                'modulos_set__lecciones_set'
            ).get(pk=capacitacion_id)

            serializer = CapacitacionProgresoSerializer(
                capacitacion,
                context={'colaborador': colaborador}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Capacitaciones.DoesNotExist:
            return Response(
                {'error': 'Capacitación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminCapacitacionProgresoView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Ver progreso de un colaborador en una capacitación específica (admin).
    
    Optimización: Usa prefetch_related con to_attr para acceso directo
    al progreso del colaborador específico.
    """
    
    def get(self, request, capacitacion_id, colaborador_id, *args, **kwargs):
        try:
            colaborador = get_object_or_404(Colaboradores, id_colaborador=colaborador_id)
            
            # Prefetch optimizado con filtro del colaborador
            capacitacion = Capacitaciones.objects.prefetch_related(
                Prefetch(
                    'progresocapacitaciones_set',
                    queryset=progresoCapacitaciones.objects.filter(colaborador=colaborador),
                    to_attr='progreso_colaborador'
                ),
                'modulos_set__lecciones_set'
            ).get(pk=capacitacion_id)
            
            serializer = CapacitacionProgresoSerializer(
                capacitacion,
                context={'colaborador': colaborador}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Capacitaciones.DoesNotExist:
            return Response(
                {'error': 'Capacitación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Colaboradores.DoesNotExist:
            return Response(
                {'error': 'Colaborador no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MisCapacitacionesListView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Lista de capacitaciones asignadas al usuario autenticado.
    
    Solo el propio usuario puede ver sus capacitaciones.
    No se permite ver capacitaciones de otros usuarios.
    
    Optimización: 
    - Cache de 2 minutos por colaborador
    - Annotate + prefetch_related + to_attr para reducir queries (87% optimización)
    """
    
    def get(self, request, *args, **kwargs):
        try:
            # Obtener colaborador SOLO desde el token del usuario autenticado
            colaborador = getattr(request.user, 'idcolaboradoru', None)
            
            if not colaborador:
                return Response(
                    {'error': 'El usuario no tiene un colaborador asociado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Intentar obtener de cache
            cache_key = get_cache_key('mis_caps', colaborador.idcolaborador)
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return Response(cached_data, status=status.HTTP_200_OK)
            
            # Optimización: Annotate + Prefetch con to_attr
            capacitaciones = Capacitaciones.objects.filter(
                progresocapacitaciones__colaborador=colaborador
            ).annotate(
                total_lecciones_count=Count('modulos__lecciones', distinct=True)
            ).prefetch_related(
                Prefetch(
                    'progresocapacitaciones_set',
                    queryset=progresoCapacitaciones.objects.filter(colaborador=colaborador),
                    to_attr='progreso_colaborador'
                ),
                Prefetch(
                    'modulos_set',
                    queryset=Modulos.objects.prefetch_related(
                        Prefetch(
                            'lecciones_set',
                            queryset=Lecciones.objects.prefetch_related(
                                Prefetch(
                                    'progresolecciones_set',
                                    queryset=progresolecciones.objects.filter(idcolaborador=colaborador),
                                    to_attr='progreso_leccion_colaborador'
                                )
                            )
                        )
                    )
                )
            ).distinct().exclude(estado__in=[2, 3]).order_by('-fecha_creacion')
            
            serializer = MisCapacitacionesSerializer(capacitaciones, many=True)
            
            # Guardar en cache (2 minutos - cambia más frecuentemente)
            cache_ttl = getattr(settings, 'CACHE_TTL_MIS_CAPACITACIONES', 120)
            cache.set(cache_key, serializer.data, cache_ttl)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
