from rest_framework import serializers
from usuarios.models import Colaboradores, Cargo, Niveles, Regional
from analitica.models import Unidadnegocio
from capacitaciones.models import progresoCapacitaciones


class ColaboradorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colaboradores
        fields = [
            'idcolaborador',
            'nombrecolaborador',
            'apellidocolaborador',
            'correocolaborador'
        ]


class perfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colaboradores
        fields = ['idcolaborador', 'nombrecolaborador', 'apellidocolaborador', 'correocolaborador', 'telefocolaborador', 'direccioncolaborador']


class CapacitacionItemSerializer(serializers.Serializer):
    id_capacitacion = serializers.IntegerField()
    nombre_capacitacion = serializers.CharField()
    completada = serializers.BooleanField()
    progreso = serializers.FloatField()
    lecciones_completadas = serializers.IntegerField()
    total_lecciones = serializers.IntegerField()


    def get_nombre_centroOP(self, obj):
        return obj.centroop.nombrecentrop if obj.centroop else None

    def get_nombre_empresa(self, obj):
        if not obj.centroop or not obj.centroop.id_proyecto:
            return None

        proyecto = obj.centroop.id_proyecto
        return proyecto.nombreproyecto

    def get_nombre_proyecto(self, obj):
        return obj.centroop.id_proyecto.nombreproyecto if obj.centroop and obj.centroop.id_proyecto else None

    def get_nombre_unidad(self, obj):
        if not obj.centroop or not obj.centroop.id_proyecto:
            return None
        proyecto = obj.centroop.id_proyecto
        relacion = Unidadnegocio.objects.filter(proyecto__idproyecto=proyecto.idproyecto).first()
        return relacion.unidad.nombreunidad if relacion else None

    def get_nombre_nivel(self, obj):
        return obj.nivelcolaborador.nombrenivel if obj.nivelcolaborador else None

    def get_nombre_regional(self, obj):
        return obj.regionalcolab.nombreregional if obj.regionalcolab else None

    def get_nombre_cargo(self, obj):
        return obj.cargocolaborador.nombrecargo if obj.cargocolaborador else None


class CapacitacionMiniFromProgresoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='capacitacion.id', read_only=True)
    titulo = serializers.CharField(source='capacitacion.titulo', read_only=True)

    class Meta:
        model = progresoCapacitaciones
        fields = ['id', 'titulo']


class ColaboradorListadoSerializer(serializers.ModelSerializer):
    id_colaborador = serializers.IntegerField(source='idcolaborador', read_only=True)
    cc_colaborador = serializers.CharField(source='cccolaborador')
    nombre_colaborador = serializers.CharField(source='nombrecolaborador')
    apellido_colaborador = serializers.CharField(source='apellidocolaborador')
    correo_colaborador = serializers.CharField(source='correocolaborador')
    nombre_centroOP = serializers.SerializerMethodField()
    nombrecargo = serializers.CharField(source='cargocolaborador.nombrecargo', allow_null=True)
    capacitaciones_totales = serializers.IntegerField(source='total_capacitaciones', read_only=True)
    estado_colaborador = serializers.IntegerField(source='estadocolaborador')
    capacitaciones_completadas = serializers.IntegerField(source='completadas', read_only=True)

    class Meta:
        model = Colaboradores
        fields = [
            'id_colaborador',
            'cc_colaborador',
            'nombre_colaborador',
            'apellido_colaborador',
            'correo_colaborador',
            'nombre_centroOP',
            'nombrecargo',
            'capacitaciones_totales',
            'estado_colaborador',
            'capacitaciones_completadas',
        ]

    def get_nombre_centroOP(self, obj):
        # Según requerimiento, devolver "eliminar"
        return 'eliminar'
    

class cargosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = ['idcargo', 'nombrecargo']


class nivelesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Niveles
        fields = ['idnivel', 'nombrenivel']


class regionalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Regional
        fields = ['idregional', 'nombreregional']
