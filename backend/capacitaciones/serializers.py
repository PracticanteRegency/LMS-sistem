from django.utils import timezone
from rest_framework import serializers
from django.db import transaction
from .utils import enviar_correo_capacitacion_creada
from .models import Capacitaciones, Modulos, progresoCapacitaciones, Lecciones, PreguntasLecciones, Respuestas, progresolecciones, progresoModulo
from usuarios.models import Colaboradores

class capacitacionSerializer(serializers.ModelSerializer):
    total_colaboradores = serializers.SerializerMethodField()
    completados = serializers.SerializerMethodField()
    porcentaje_completado = serializers.SerializerMethodField()

    class Meta:
        model = Capacitaciones
        fields = ['id', 
                  'titulo', 
                  'descripcion', 
                  'tipo',
                  'imagen', 
                  'estado', 
                  'fecha_creacion', 
                  'fecha_inicio', 
                  'fecha_fin',
                  'total_colaboradores',
                  'completados',
                  'porcentaje_completado']
        
    def get_total_colaboradores(self, obj):
        return progresoCapacitaciones.objects.filter(
            capacitacion=obj
        ).values('colaborador').distinct().count()

    def get_completados(self, obj):
        return progresoCapacitaciones.objects.filter(
            capacitacion=obj,
            completada=True
        ).values('colaborador').distinct().count()

    def get_porcentaje_completado(self, obj):
        total = self.get_total_colaboradores(obj)
        comps = self.get_completados(obj)

        if total == 0:
            return 0
        
        return round((comps / total) * 100, 2)


class RespuestaSerializer(serializers.ModelSerializer):
    url_imagen = serializers.CharField(source='urlimagen')
    
    class Meta:
        model = Respuestas
        fields = ['id', 
                  'valor',  
                  'url_imagen']


class PreguntaLeccionSerializer(serializers.ModelSerializer):
    respuestas = RespuestaSerializer(many=True, source='respuestas_set', read_only=True)
    tipo_pregunta = serializers.CharField(source='tipopregunta')
    url_multimedia = serializers.CharField(source='urlmultimedia')

    class Meta:
        model = PreguntasLecciones
        fields = ['id', 
                  'pregunta', 
                  'tipo_pregunta', 
                  'url_multimedia', 
                  'respuestas']


class LeccionSerializer(serializers.ModelSerializer):
    preguntas = PreguntaLeccionSerializer(many=True, source='preguntaslecciones_set', read_only=True)
    titulo_leccion = serializers.CharField(source='tituloleccion')
    tipo_leccion = serializers.CharField(source='tipoleccion')

    class Meta:
        model = Lecciones
        fields = ['id', 
                  'titulo_leccion', 
                  'tipo_leccion', 
                  'url', 
                  'preguntas']


class ModuloSerializer(serializers.ModelSerializer):
    lecciones = LeccionSerializer(many=True, source='lecciones_set', read_only=True)
    nombre_modulo = serializers.CharField(source='nombremodulo')

    class Meta:
        model = Modulos
        fields = ['id', 
                  'nombre_modulo', 
                  'lecciones']

    def get_lecciones(self, obj):   
        lecciones = Lecciones.objects.filter(modulo=obj)
        return LeccionSerializer(lecciones, many=True).data


class ColaboradorSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='idcolaborador')
    nombre = serializers.CharField(source='nombrecolaborador')
    apellido = serializers.CharField(source='apellidocolaborador')
    cedula = serializers.CharField(source='cccolaborador')

    class Meta:
        model = Colaboradores
        fields = ['id', 'nombre', 'apellido', 'cedula']


class CapacitacionDetalleSerializer(serializers.ModelSerializer):
    modulos = ModuloSerializer(many=True, source='modulos_set', read_only=True)
    colaboradores = serializers.SerializerMethodField()

    class Meta:
        model = Capacitaciones
        fields = [
            'id',
            'titulo',
            'descripcion',
            'imagen',
            'estado',
            'fecha_creacion',
            'fecha_inicio',
            'fecha_fin',
            'modulos',
            'colaboradores'
        ]

    def get_colaboradores(self, obj):
        progres = progresoCapacitaciones.objects.filter(capacitacion=obj).select_related('colaborador')
        colaboradores = [p.colaborador for p in progres]
        return ColaboradorSerializer(colaboradores, many=True).data
    

class CapacitacionColaboradorSerializer(serializers.ModelSerializer):
    capacitacion = CapacitacionDetalleSerializer(read_only=True)

    class Meta:
        model = progresoCapacitaciones
        fields = ['id', 
                  'capacitacion', 
                  'fecha_registro']


class CrearCapacitacionSerializer(serializers.ModelSerializer):
    modulos = serializers.ListField(required=False)
    colaboradores = serializers.ListField(required=False)

    class Meta:
        model = Capacitaciones
        fields = ['titulo', 
                  'descripcion', 
                  'imagen', 
                  'tipo',
                  'fecha_inicio', 
                  'fecha_fin', 
                  'modulos', 
                  'colaboradores']

    def create(self, validated_data):
        modulos_data = validated_data.pop('modulos', [])
        colaboradores_data = validated_data.pop('colaboradores', [])

        with transaction.atomic():
            capacitacion = Capacitaciones.objects.create(
                estado=0,
                **validated_data
            )
            hoy = timezone.now().date()
            if capacitacion.fecha_inicio.date() == hoy:
                capacitacion.estado = 1
                capacitacion.save()
            # crea los módulos
            for modulo_data in modulos_data:
                lecciones_data = modulo_data.pop('lecciones', [])
                modulo = Modulos.objects.create(
                    idcapacitacion=capacitacion,
                    nombremodulo=modulo_data.get('nombre_modulo')
                )

                # crea las lecciones
                for leccion_data in lecciones_data:
                    preguntas_data = leccion_data.pop('preguntas', [])
                    leccion = Lecciones.objects.create(
                        idmodulo=modulo,
                        tituloleccion=leccion_data.get('titulo_leccion'),
                        tipoleccion=leccion_data.get('tipo_leccion'),
                        url=leccion_data.get('url', None)
                    )

                    # Si la lección es de tipo formulario, crear preguntas y respuestas
                    if leccion.tipoleccion.lower() == 'formulario':
                        for pregunta_data in preguntas_data:
                            respuestas_data = pregunta_data.pop('respuestas', [])
                            pregunta = PreguntasLecciones.objects.create(
                                id_leccion=leccion,
                                pregunta=pregunta_data.get('pregunta'),
                                tipopregunta=pregunta_data.get('tipo_pregunta'),
                                urlmultimedia=pregunta_data.get('url_multimedia', None)
                            )

                            for respuesta_data in respuestas_data:
                                Respuestas.objects.create(
                                    idpregunta=pregunta,
                                    valor=respuesta_data.get('valor'),
                                    escorrecto=respuesta_data.get('es_correcto', 0),
                                    urlimagen=respuesta_data.get('url_imagen', None)
                                )

            for colaborador_id in colaboradores_data:
                progresoCapacitaciones.objects.create(
                    capacitacion=capacitacion,
                    colaborador_id=colaborador_id,
                    fecha_registro=timezone.now(),
                    completada=False,
                    progreso=0
                )

        hoy = timezone.now().date()

        if capacitacion.fecha_inicio.date() == hoy:
            enviar_correo_capacitacion_creada(capacitacion)

        return capacitacion

    def update(self, instance, validated_data):
        """Actualizar capacitación incluyendo módulos/lecciones y sincronizar colaboradores."""
        modulos_data = validated_data.pop('modulos', None)
        colaboradores_data = validated_data.pop('colaboradores', None)

        with transaction.atomic():
            # Actualizar campos simples
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Reemplazar módulos y lecciones si se envía 'modulos'
            if modulos_data is not None:
                # Borrar módulos existentes y su cascade de lecciones/preguntas
                Modulos.objects.filter(idcapacitacion=instance).delete()
                for modulo_data in modulos_data:
                    lecciones_data = modulo_data.get('lecciones', [])
                    modulo = Modulos.objects.create(
                        idcapacitacion=instance,
                        nombremodulo=modulo_data.get('nombre_modulo')
                    )
                    for leccion_data in lecciones_data:
                        preguntas_data = leccion_data.get('preguntas', [])
                        leccion = Lecciones.objects.create(
                            idmodulo=modulo,
                            tituloleccion=leccion_data.get('titulo_leccion'),
                            tipoleccion=leccion_data.get('tipo_leccion'),
                            url=leccion_data.get('url', None)
                        )
                        if str(leccion.tipoleccion).lower() == 'formulario':
                            for pregunta_data in preguntas_data:
                                respuestas_data = pregunta_data.get('respuestas', [])
                                pregunta = PreguntasLecciones.objects.create(
                                    id_leccion=leccion,
                                    pregunta=pregunta_data.get('pregunta'),
                                    tipopregunta=pregunta_data.get('tipo_pregunta'),
                                    urlmultimedia=pregunta_data.get('url_multimedia', None)
                                )
                                for respuesta_data in respuestas_data:
                                    Respuestas.objects.create(
                                        idpregunta=pregunta,
                                        valor=respuesta_data.get('valor'),
                                        escorrecto=respuesta_data.get('es_correcto', 0),
                                        urlimagen=respuesta_data.get('url_imagen', None)
                                    )

            # Sincronizar colaboradores si se envía la lista
            added = []
            removed = []
            if colaboradores_data is not None:
                incoming = set(colaboradores_data)
                # Validar existencia
                existing_cols = set(Colaboradores.objects.filter(idcolaborador__in=incoming).values_list('idcolaborador', flat=True))
                missing = incoming - existing_cols
                if missing:
                    raise serializers.ValidationError({'colaboradores': f'Colaboradores no encontrados: {list(missing)}'})

                current = set(progresoCapacitaciones.objects.filter(capacitacion=instance).values_list('colaborador_id', flat=True))
                to_add = incoming - current
                to_remove = current - incoming

                # Agregar nuevos
                bulk_objs = []
                for cid in to_add:
                    bulk_objs.append(progresoCapacitaciones(
                        capacitacion=instance,
                        colaborador_id=cid,
                        fecha_registro=timezone.now(),
                        completada=False,
                        progreso=0
                    ))
                    added.append(cid)
                if bulk_objs:
                    progresoCapacitaciones.objects.bulk_create(bulk_objs)

                # Eliminar removidos y limpiar progreso relacionado
                if to_remove:
                    for cid in to_remove:
                        # eliminar registros de progreso a nivel lecciones y modulos
                        progresolecciones.objects.filter(idcolaborador_id=cid, idleccion__idmodulo__idcapacitacion=instance).delete()
                        progresoModulo.objects.filter(colaborador_id=cid, modulo__idcapacitacion=instance).delete()
                        progresoCapacitaciones.objects.filter(capacitacion=instance, colaborador_id=cid).delete()
                        removed.append(cid)

                # Note: cache invalidation of collaborators is handled at view layer

            # Enviar notificación solo a los nuevos agregados
            # Enviar notificación solo a los nuevos agregados una vez la transacción se confirme
            if added:
                try:
                    transaction.on_commit(lambda: enviar_correo_capacitacion_creada(instance, colaboradores_ids=added))
                except Exception:
                    # No queremos que el envio de correos impida la actualización
                    pass

            return instance
    

class LeccionProgresoSerializer(serializers.ModelSerializer):
    progreso = serializers.SerializerMethodField()
    completada = serializers.SerializerMethodField()
    preguntas = serializers.SerializerMethodField()
    titulo_leccion = serializers.CharField(source='tituloleccion')
    tipo_leccion = serializers.CharField(source='tipoleccion')

    class Meta:
        model = Lecciones
        fields = ['id', 'titulo_leccion', 'tipo_leccion', 'url', 'progreso', 'completada', 'preguntas']

    def get_progreso(self, obj):
        colaborador = self.context['colaborador']
        progreso = progresolecciones.objects.filter(idcolaborador=colaborador, idleccion=obj).first()
        return progreso.progreso if progreso else 0

    def get_completada(self, obj):
        colaborador = self.context['colaborador']
        progreso = progresolecciones.objects.filter(idcolaborador=colaborador, idleccion=obj).first()
        return progreso.completada if progreso else False
    
    def get_preguntas(self, obj):
        preguntas = PreguntasLecciones.objects.filter(id_leccion=obj)
        return PreguntaLeccionSerializer(preguntas, many=True).data


class ModuloProgresoSerializer(serializers.ModelSerializer):
    lecciones = serializers.SerializerMethodField()
    progreso = serializers.SerializerMethodField()
    completada = serializers.SerializerMethodField()
    nombre_modulo = serializers.CharField(source='nombremodulo')

    class Meta:
        model = Modulos
        fields = ['id', 'nombre_modulo', 'progreso', 'completada', 'lecciones']

    def get_lecciones(self, obj):
        colaborador = self.context['colaborador']
        lecciones = Lecciones.objects.filter(idmodulo=obj)
        return LeccionProgresoSerializer(
            lecciones,
            many=True,
            context={'colaborador': colaborador}
        ).data

    def get_progreso(self, obj):
        colaborador = self.context['colaborador']
        prog = progresoModulo.objects.filter(colaborador=colaborador, modulo=obj).first()
        return prog.progreso if prog else 0

    def get_completada(self, obj):
        colaborador = self.context['colaborador']
        prog = progresoModulo.objects.filter(colaborador=colaborador, modulo=obj).first()
        return prog.completada if prog else False


class CapacitacionProgresoSerializer(serializers.ModelSerializer):
    progreso = serializers.SerializerMethodField()
    completada = serializers.SerializerMethodField()
    modulos = serializers.SerializerMethodField()

    class Meta:
        model = Capacitaciones
        fields = [
            'id',
            'titulo',
            'descripcion',
            'imagen',
            'progreso',
            'completada',
            'modulos'
        ]

    def get_progreso(self, obj):
        # Usar datos prefetched si están disponibles
        if hasattr(obj, 'progreso_colaborador') and obj.progreso_colaborador:
            return obj.progreso_colaborador[0].progreso
        
        # Fallback para compatibilidad
        colaborador = self.context['colaborador']
        prog = progresoCapacitaciones.objects.filter(colaborador=colaborador, capacitacion=obj).first()
        return prog.progreso if prog else 0

    def get_completada(self, obj):
        # Usar datos prefetched si están disponibles
        if hasattr(obj, 'progreso_colaborador') and obj.progreso_colaborador:
            return obj.progreso_colaborador[0].completada
        
        # Fallback para compatibilidad
        colaborador = self.context['colaborador']
        prog = progresoCapacitaciones.objects.filter(colaborador=colaborador, capacitacion=obj).first()
        return prog.completada if prog else False

    def get_modulos(self, obj):
        colaborador = self.context['colaborador']
        
        # Usar datos prefetched si están disponibles
        if hasattr(obj, 'modulos_set'):
            modulos = obj.modulos_set.all()
        else:
            modulos = Modulos.objects.filter(capacitacion=obj)
        
        return ModuloProgresoSerializer(
            modulos,
            many=True,
            context={'colaborador': colaborador}
        ).data


class progresoModuloSerializer(serializers.ModelSerializer):
    modulo = serializers.CharField(source='modulo.nombremodulo')

    class Meta:
        model = progresoModulo
        fields = ['modulo', 'progreso', 'completada', 'fecha_completado']

class ProgresoLeccionSerializer(serializers.ModelSerializer):
    leccion = serializers.CharField(source='leccion.titulo_leccion')

    class Meta:
        model = progresolecciones
        fields = ['leccion', 'progreso', 'completada', 'fecha_completado']


class ProgresoCapacitacionSerializer(serializers.ModelSerializer):
    capacitacion = serializers.CharField(source='capacitacion.titulo')

    class Meta:
        model = progresoCapacitaciones

        fields = ['capacitacion', 'progreso', 'completada']

class ColaboradorCapacitacionesSerializer(serializers.ModelSerializer):
    capacitaciones = serializers.SerializerMethodField()
    correo_colaborador = serializers.CharField(source='correocolaborador')
    nombre_colaborador = serializers.CharField(source='nombrecolaborador')
    apellido_colaborador = serializers.CharField(source='apellidocolaborador')
    id_colaborador = serializers.IntegerField(source='idcolaborador')

    class Meta:
        model = Colaboradores
        fields = [
            'id_colaborador',
            'nombre_colaborador',
            'apellido_colaborador',
            'correo_colaborador',
            'capacitaciones'
        ]

    def get_capacitaciones(self, obj):
        capacitaciones = Capacitaciones.objects.filter(
            id__in=progresoCapacitaciones.objects.filter(colaborador=obj).values('capacitacion')
        ).exclude(estado=2).order_by('-fecha_creacion')

        return CapacitacionProgresoSerializer(
            capacitaciones,
            many=True,
            context={'colaborador': obj}
        ).data

class MisCapacitacionesSerializer(serializers.ModelSerializer):
    progreso = serializers.SerializerMethodField()
    completada = serializers.SerializerMethodField()
    lecciones_completadas = serializers.SerializerMethodField()
    total_lecciones = serializers.IntegerField(source='total_lecciones_count', read_only=True)

    class Meta:
        model = Capacitaciones
        fields = [
            'id',
            'titulo',
            'progreso',
            'imagen',
            'completada',
            'lecciones_completadas',
            'total_lecciones'
        ]

    def get_progreso(self, obj):
        # Usar datos prefetched en lugar de nueva query
        if hasattr(obj, 'progreso_colaborador') and obj.progreso_colaborador:
            return obj.progreso_colaborador[0].progreso
        return 0

    def get_completada(self, obj):
        # Usar datos prefetched en lugar de nueva query
        if hasattr(obj, 'progreso_colaborador') and obj.progreso_colaborador:
            return obj.progreso_colaborador[0].completada
        return False

    def get_lecciones_completadas(self, obj):
        # Usar datos prefetched en lugar de nueva query
        if not hasattr(obj, 'modulos_set'):
            return 0
        
        count = 0
        for modulo in obj.modulos_set.all():
            for leccion in modulo.lecciones_set.all():
                if hasattr(leccion, 'progreso_leccion_colaborador'):
                    for progreso in leccion.progreso_leccion_colaborador:
                        if progreso.completada:
                            count += 1
        return count


class capacitacionUpdateSerializer(serializers.ModelSerializer):
    modulos = serializers.ListField(required=False)
    lecciones = serializers.ListField(required=False)
    preguntas = serializers.ListField(required=False)
    respuestas = serializers.ListField(required=False)
    colaboradores = serializers.ListField(required=False)
    class Meta:
        model = Capacitaciones
        fields = ['titulo', 
                  'descripcion', 
                  'imagen', 
                  'tipo',
                  'fecha_inicio', 
                  'fecha_fin']  

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def validate(self, data):
        if 'fecha_inicio' in data and 'fecha_fin' in data:
            if data['fecha_inicio'] > data['fecha_fin']:
                raise serializers.ValidationError("La fecha de inicio no puede ser posterior a la fecha de fin.")
        return data

    def modulos_existentes(self, capacitacion):
        return Modulos.objects.filter(idcapacitacion=capacitacion)
    
    def lecciones_existentes(self, modulo):
        return Lecciones.objects.filter(idmodulo=modulo)
    
    def preguntas_existentes(self, leccion):
        return PreguntasLecciones.objects.filter(id_leccion=leccion)
    
    def respuestas_existentes(self, pregunta):
        return Respuestas.objects.filter(idpregunta=pregunta)
    
    def colaboradores_existentes(self, capacitacion):
        return progresoCapacitaciones.objects.filter(capacitacion=capacitacion)
