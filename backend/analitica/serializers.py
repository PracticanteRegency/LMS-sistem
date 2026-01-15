from rest_framework import serializers
from .models import Epresa, Unidadnegocio, Proyecto, Centroop

# --- Empresa ---
class EpresaSerializer(serializers.ModelSerializer):
    unidades = serializers.SerializerMethodField()

    class Meta:
        model = Epresa
        fields = ['idempresa', 'nombre_empresa', 'nitempresa', 'estadoempresa', 'unidades']

    def create(self, validated_data):
        empresa = Epresa.objects.create(**validated_data)
        return empresa

    def get_unidades(self, obj):
        unidades = obj.unidadnegocio_set.all()
        return UnidadNegocioSerializer(unidades, many=True).data


# --- Unidad de Negocio ---
class UnidadNegocioSerializer(serializers.ModelSerializer):
    id_empresa = serializers.IntegerField(write_only=True, required=False)
    proyectos = serializers.SerializerMethodField()

    class Meta:
        model = Unidadnegocio
        fields = [
            'idunidad',
            'nombreunidad',
            'descripcionunidad',
            'estadounidad',
            'id_empresa',
            'proyectos'
        ]
    # Note: omit embedding full `empresa` here to avoid circular nesting

    def get_proyectos(self, obj):
        proyectos = obj.proyecto_set.all()
        return ProyectoSerializer(proyectos, many=True).data

    def create(self, validated_data):

        empresa_id = validated_data.pop('id_empresa', None)

        if not empresa_id:
            raise serializers.ValidationError({"id_empresa": "Debe especificar una empresa existente."})
        empresa = Epresa.objects.filter(idempresa=empresa_id).first()
        if not empresa:
            raise serializers.ValidationError({"id_empresa": "La empresa indicada no existe."})
        unidad = Unidadnegocio.objects.create(id_empresa=empresa, **validated_data)
        return unidad
    
    def update(self, instance, validated_data):
        """Permite actualizar los campos y cambiar la empresa asociada."""
        empresa_id = validated_data.pop('id_empresa', None)

        # Si se envía un id_empresa nuevo, actualiza la relación
        if empresa_id:
            empresa = Epresa.objects.filter(idempresa=empresa_id).first()
            if not empresa:
                raise serializers.ValidationError({"id_empresa": "La empresa indicada no existe."})
            instance.id_empresa = empresa

        # Actualiza los demás campos normalmente
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
    

# --- Proyecto ---
class ProyectoSerializer(serializers.ModelSerializer):
    centros = serializers.SerializerMethodField()

    class Meta:
        model = Proyecto
        fields = 'idproyecto', 'nombreproyecto', 'centros'

    def create(self, validated_data):
        proyecto = Proyecto.objects.create(**validated_data)
        return proyecto

    def get_centros(self, obj):
        centros = obj.centroop_set.all()
        return CentroOpSimpleSerializer(centros, many=True).data




class ProyectoConUnidadSerializer(serializers.ModelSerializer):
    unidad = UnidadNegocioSerializer(source='id_unidad', read_only=True)

    class Meta:
        model = Proyecto
        fields = ['idproyecto', 'nombreproyecto', 'estadoproyecto', 'idcolaborador', 'unidad']

    

# --- Centro de Operaciones ---
class CentroOpSerializer(serializers.ModelSerializer):
    proyecto = serializers.SerializerMethodField()

    class Meta:
        model = Centroop
        fields = ['idcentrop', 'nombrecentrop', 'estadocentrop', 'proyecto']

    def get_proyecto(self, obj):
        # Si el centro está inactivo, no mostrar nada
        if getattr(obj, 'estadocentrop', None) != 1:
            return None

        proyecto = obj.id_proyecto
        if not proyecto or getattr(proyecto, 'estadoproyecto', None) != 1:
            return None
        return ProyectoSerializer(proyecto).data

    def create(self, validated_data):

        proyecto_id = self.initial_data.get('id_proyecto')
        proyecto = Proyecto.objects.filter(idproyecto=proyecto_id).first()

        if not proyecto:
            raise serializers.ValidationError({"id_proyecto": "El proyecto indicado no existe."})

        centro_op = Centroop.objects.create(id_proyecto=proyecto, **validated_data)
        return centro_op
    

class listaCentroOpSerializer(serializers.ModelSerializer):
    proyecto = ProyectoSerializer(read_only=True)

    class Meta:
        model = Centroop
        fields = ['idcentrop', 'nombrecentrop', 'estadocentrop', 'proyecto']

    def get_proyecto(self, obj):

        if getattr(obj, 'estadocentrop', None) != 1:
            return None

        proyecto = obj.id_proyecto
        if not proyecto or getattr(proyecto, 'estadoproyecto', None) != 1:
            return None
        return ProyectoSerializer(proyecto).data


class CentroOpSimpleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Centroop
        fields = ['idcentrop', 'nombrecentrop', 'estadocentrop']


# --- Empresa --- class EpresaSerializer(serializers.ModelSerializer): class Meta: model = Epresa fields = ['id_empresa', 'nombre_empresa', 'nit_empresa', 'estado_empresa'] def create(self, validated_data): empresa = Epresa.objects.create(**validated_data) return empresa # --- Unidad de Negocio --- class UnidadNegocioSerializer(serializers.ModelSerializer): id_empresa = serializers.IntegerField(write_only=True, required=False) empresa = EpresaSerializer(read_only=True) class Meta: model = Unidadnegocio fields = ['id_unidad', 'nombre_unidad', 'descripcion_unidad', 'estado_unidad', 'id_empresa', 'empresa'] def get_empresa(self, obj): if obj.empresa and obj.empresa.estado_empresa == 1: return EpresaSerializer(obj.empresa).data return None def create(self, validated_data): empresa_id = validated_data.pop('id_empresa', None) if not empresa_id: raise serializers.ValidationError({"id_empresa": "Debe especificar una empresa existente."}) empresa = Epresa.objects.filter(id_empresa=empresa_id).first() if not empresa: raise serializers.ValidationError({"id_empresa": "La empresa indicada no existe."}) unidad = Unidadnegocio.objects.create(empresa=empresa, **validated_data) return unidad def update(self, instance, validated_data): """Permite actualizar los campos y cambiar la empresa asociada.""" empresa_id = validated_data.pop('id_empresa', None) # Si se envía un id_empresa nuevo, actualiza la relación if empresa_id: empresa = Epresa.objects.filter(id_empresa=empresa_id).first() if not empresa: raise serializers.ValidationError({"id_empresa": "La empresa indicada no existe."}) instance.empresa = empresa # Actualiza los demás campos normalmente for attr, value in validated_data.items(): setattr(instance, attr, value) instance.save() return instance # --- Proyecto --- class ProyectoSerializer(serializers.ModelSerializer): class Meta: model = Proyecto fields = '__all__' def create(self, validated_data): proyecto = Proyecto.objects.create(**validated_data) return proyecto class ProyectoConUnidadSerializer(serializers.ModelSerializer): unidad = UnidadNegocioSerializer() class Meta: model = Proyecto fields = ['id_proyecto', 'nombre_proyecto', 'estado_proyecto', 'encargado_proyecto', 'unidad'] # --- Centro de Operaciones --- class CentroOpSerializer(serializers.ModelSerializer): proyecto = serializers.SerializerMethodField() class Meta: model = Centroop fields = ['id_centrop', 'nombre_centrop', 'estado_centrop', 'proyecto'] def get_proyecto(self, obj): # Si el centro está inactivo, no mostrar nada if obj.estado_centrop != 1: return None proyecto = obj.id_proyecto if not proyecto or proyecto.estado_proyecto != 1: return None return proyecto.data def create(self, validated_data): proyecto_id = self.initial_data.get('id_proyecto') proyecto = Proyecto.objects.filter(id_proyecto=proyecto_id).first() if not proyecto: raise serializers.ValidationError({"id_proyecto": "El proyecto indicado no existe."}) centro_op = Centroop.objects.create(id_proyecto=proyecto, **validated_data) return centro_op class listaCentroOpSerializer(serializers.ModelSerializer): proyecto = ProyectoSerializer(read_only=True) class Meta: model = Centroop fields = ['id_centrop', 'nombre_centrop', 'estado_centrop', 'proyecto'] def get_proyecto(self, obj): if obj.estado_centrop != 1: return None proyecto = obj.id_proyecto if not proyecto or proyecto.estado_proyecto != 1: return None return proyecto(proyecto).data class CentroOpSimpleSerializer(serializers.ModelSerializer): proyecto = ProyectoSerializer(source='id_proyecto', read_only=True) class Meta: model = Centroop fields = ['id_centrop', 'nombre_centrop', 'estado_centrop', 'proyecto'] # --- carga masiva estructura --- class CargarEstructuraSerializer(serializers.Serializer): empresa = serializers.CharField() unidades = serializers.ListField() def create(self, validated_data): empresa_nombre = validated_data["empresa"].strip().upper() # Crear o traer empresa empresa, _ = Epresa.objects.get_or_create( nombre_empresa=empresa_nombre, defaults={"nit_empresa": "0", "estado_empresa": 1} ) for unidad_data in validated_data["unidades"]: unidad_nombre = unidad_data["unidad"].strip().upper() unidad, _ = Unidadnegocio.objects.get_or_create( nombre_unidad=unidad_nombre, empresa=empresa, defaults={"descripcion_unidad": unidad_nombre, "estado_unidad": 1} ) for proyecto_data in unidad_data["proyectos"]: proyecto_nombre = proyecto_data["proyecto"].strip().upper() proyecto, _ = Proyecto.objects.get_or_create( nombre_proyecto=proyecto_nombre, unidad=unidad, defaults={"estado_proyecto": 1} ) for centro in proyecto_data["centros"]: Centroop.objects.get_or_create( nombre_centrop=centro.strip().upper(), id_proyecto=proyecto, defaults={"estado_centrop": 1} ) return {"status": "ok", "empresa": empresa_nombre}


# --- carga masiva estructura ---

class CargarEstructuraSerializer(serializers.Serializer):
    empresa = serializers.CharField()
    unidades = serializers.ListField()

    def create(self, validated_data):
        empresa_nombre = validated_data["empresa"].strip().upper()

        # Crear o traer empresa
        empresa, _ = Epresa.objects.get_or_create(
            nombre_empresa=empresa_nombre,
            defaults={"nitempresa": "0", "estadoempresa": 1}
        )

        for unidad_data in validated_data["unidades"]:
            unidad_nombre = unidad_data["unidad"].strip().upper()

            unidad, _ = Unidadnegocio.objects.get_or_create(
                nombreunidad=unidad_nombre,
                id_empresa=empresa,
                defaults={"descripcionunidad": unidad_nombre, "estadounidad": 1}
            )

            for proyecto_data in unidad_data["proyectos"]:
                proyecto_nombre = proyecto_data["proyecto"].strip().upper()

                proyecto, _ = Proyecto.objects.get_or_create(
                    nombreproyecto=proyecto_nombre,
                    id_unidad=unidad,
                    defaults={"estadoproyecto": 1}
                )

                for centro in proyecto_data["centros"]:
                    Centroop.objects.get_or_create(
                        nombrecentrop=centro.strip().upper(),
                        id_proyecto=proyecto,
                        defaults={"estadocentrop": 1}
                    )

        return {"status": "ok", "empresa": empresa_nombre}



