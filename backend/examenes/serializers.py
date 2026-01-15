from rest_framework import serializers
from .models import Examen, ExamenesCargo, CorreoExamenEnviado, RegistroExamenes, ExamenTrabajador
from usuarios.models import Cargo


class ExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examen
        fields = ['id_examen', 'nombre', 'activo']


class ExamenesCargoSerializer(serializers.ModelSerializer):
    examen = ExamenSerializer()

    class Meta:
        model = ExamenesCargo
        fields = ['examen', 'empresa', 'cargo', 'fecha_creacion']


class CargoSerializer(serializers.Serializer):
    """Serializa cargos con sus detalles"""
    id = serializers.IntegerField(source='idcargo')
    nombre = serializers.CharField(source='nombrecargo')


class EmpresaConCargosSerializer(serializers.Serializer):
    """Serializa empresas con sus cargos y exámenes asociados, agrupados por tipo"""
    id = serializers.IntegerField(source='id_empresa')
    nombre = serializers.CharField(source='nombre_empresa')
    cargos = serializers.SerializerMethodField()

    def get_cargos(self, obj):
        """Obtiene los cargos únicos asociados a esta empresa con sus exámenes agrupados por tipo"""
        # Obtener todos los cargos que tienen exámenes activos en esta empresa
        cargos = Cargo.objects.filter(
            examenes_por_empresa__empresa_id=obj['id_empresa'],
            examenes_por_empresa__examen__activo=True,
            estadocargo=1  # Solo cargos activos
        ).distinct().order_by('nombrecargo')

        cargos_data = []
        for cargo in cargos:
            # Obtener exámenes activos para este cargo en esta empresa
            examenes = ExamenesCargo.objects.filter(
                empresa_id=obj['id_empresa'],
                cargo_id=cargo.idcargo,
                examen__activo=True
            ).select_related('examen').order_by('examen__nombre', 'tipo')

            # Agrupar exámenes por tipo
            examenes_por_tipo = {
                'INGRESO': [],
                'PERIODICO': [],
                'RETIRO': [],
                'ESPECIAL': [],
                'POST_INCAPACIDAD': []
            }

            for ec in examenes:
                examen_data = {
                    'id': ec.examen.id_examen,
                    'nombre': ec.examen.nombre
                }
                # Filtro especial para RETIRO: solo incluir "EXAMEN MEDICO OCUPACIONAL"
                if ec.tipo == 'RETIRO':
                    if ec.examen.nombre == 'EXAMEN MEDICO OCUPACIONAL':
                        examenes_por_tipo[ec.tipo].append(examen_data)
                elif ec.tipo in examenes_por_tipo:
                    examenes_por_tipo[ec.tipo].append(examen_data)

            cargo_data = {
                'id': cargo.idcargo,
                'nombre': cargo.nombrecargo,
                'examenes_por_tipo': {
                    k: v for k, v in examenes_por_tipo.items()
                    if v  # Solo incluir tipos con exámenes
                }
            }
            cargos_data.append(cargo_data)

        return cargos_data


class EnviarCorreoSerializer(serializers.Serializer):
    """Serializer para enviar correo individual de exámenes médicos.
    
    Recibe datos del trabajador y los IDs de exámenes seleccionados desde el frontend.
    La empresa se deriva automáticamente del centro operativo.
    """
    centro_id = serializers.IntegerField(
        help_text="ID del centro operativo del trabajador"
    )
    cargo_id = serializers.IntegerField(
        help_text="ID del cargo del trabajador"
    )
    tipo_examen = serializers.ChoiceField(
        choices=['INGRESO', 'PERIODICO', 'RETIRO', 'ESPECIAL', 'POST_INCAPACIDAD'],
        help_text="Tipo de examen: INGRESO, PERIODICO, RETIRO, ESPECIAL o POST_INCAPACIDAD"
    )
    examenes_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="Lista de IDs de exámenes a asignar al trabajador"
    )
    nombre_trabajador = serializers.CharField(max_length=150)
    documento_trabajador = serializers.CharField(max_length=50)
    correo_destino = serializers.EmailField(required=False, allow_blank=True)
    ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True)


class ReporteCorreoSerializer(serializers.ModelSerializer):
    """Serializer para listar correos enviados en el reporte"""
    enviado_por_nombre = serializers.SerializerMethodField()
    trabajadores_count = serializers.SerializerMethodField()

    class Meta:
        model = CorreoExamenEnviado
        fields = [
            'id',
            'uuid_correo',
            'asunto',
            'fecha_envio',
            'enviado_por_nombre',
            'trabajadores_count',
            'enviado_correctamente']
        read_only_fields = fields

    def get_enviado_por_nombre(self, obj):
        # Ajuste a nombre del campo real en Colaboradores
        return obj.enviado_por.nombrecolaborador if obj.enviado_por else "N/A"

    def get_trabajadores_count(self, obj):
        """Cantidad de trabajadores en este correo"""
        return obj.registros_examenes.count() if hasattr(obj, 'registros_examenes') else 0


class DetalleCorreoSerializer(serializers.ModelSerializer):
    """Serializer para ver detalle completo de un correo enviado SIN trabajadores"""
    enviado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = CorreoExamenEnviado
        fields = [
            'id', 'uuid_correo', 'asunto', 'cuerpo_correo', 'correos_destino',
            'enviado_por_nombre', 'fecha_envio', 'enviado_correctamente'
        ]
        read_only_fields = fields

    def get_enviado_por_nombre(self, obj):
        # Ajuste a nombre del campo real en Colaboradores
        return obj.enviado_por.nombrecolaborador if obj.enviado_por else "N/A"


class RegistroExamenesSerializer(serializers.ModelSerializer):
    """Serializer para tabla RegistroExamenes (trabajadores de exámenes)"""
    empresa_nombre = serializers.CharField(
        source='empresa.nombre_empresa', read_only=True)
    cargo_nombre = serializers.CharField(
        source='cargo.nombrecargo', read_only=True)

    ciudad = serializers.CharField(read_only=True)

    class Meta:
        model = RegistroExamenes
        fields = [
            'id',
            'ciudad',
            'nombre_trabajador',
            'documento_trabajador',
            'empresa',
            'empresa_nombre',
            'cargo',
            'cargo_nombre',
            'fecha_registro']
        read_only_fields = ['id', 'fecha_registro']


class ListarTrabajadoresCorreoSerializer(serializers.ModelSerializer):
    """Serializer que devuelve el detalle de un trabajador dentro de un correo/lote"""
    correo_id = serializers.IntegerField(source='correo_lote.id', read_only=True)
    uuid_trabajador = serializers.CharField(read_only=True)
    cargo_nombre = serializers.CharField(source='cargo.nombrecargo', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre_empresa', read_only=True)
    estado_nombre = serializers.SerializerMethodField()
    registro_correo = serializers.SerializerMethodField()

    class Meta:
        model = RegistroExamenes
        fields = [
            'id', 'correo_id', 'uuid_trabajador', 'nombre_trabajador', 'documento_trabajador',
            'cargo_nombre', 'empresa_nombre', 'ciudad', 'estado_nombre', 'registro_correo'
        ]

    # Nota: No se incluyen los campos detallados de exámenes en esta vista por privacidad/consulta

    def _get_precargados(self, obj):
        """Retorna lista de `ExamenTrabajador` precargados si existen, sino hace la query."""
        return getattr(obj, 'examenes_precargados', list(obj.examenes.select_related('examen').all()))

    def get_estado_nombre(self, obj):
        """Use `RegistroExamenes.estado_trabajador` as the source of truth.

        We intentionally decouple from per-exam records; UI should reflect the
        worker-level state stored in `estado_trabajador`.
        """
        return "Completado" if obj.estado_trabajador == 1 else "Pendiente"

    def get_registro_correo(self, obj):
        """Incluye el estado computado del trabajador dentro de `registro_correo` para compatibilidad con el frontend"""
        return {
            'estado_trabajador': obj.estado_trabajador,
            'estado_nombre': self.get_estado_nombre(obj)
        }


class EnviarCorreoMasivoSerializer(serializers.Serializer):
    """Serializer para enviar correos masivos con CSV de trabajadores"""
    archivo_csv = serializers.FileField(
        help_text=(
            "Archivo CSV con columnas: "
            "Empresa,Unidad,Proyecto,Centro,Nombre,CC,Ciudad,"
            "Cargo,TipoExamen,Examenes"
        )
    )
    asunto = serializers.CharField(
        max_length=200,
        required=False,
        help_text="Asunto del correo (opcional, por defecto: 'Exámenes médicos')"
    )
    cuerpo_correo = serializers.CharField(
        required=False,
        help_text=(
            "Cuerpo del correo (opcional, se genera "
            "automáticamente con el UUID de seguimiento)"
        )
    )
    adjuntar_excel = serializers.BooleanField(
        required=False,
        default=False,
        help_text=(
            "Si es True, adjunta un Excel con el detalle"
        )
    )

    def validate_archivo_csv(self, file):
        """Valida que el archivo sea CSV"""
        if not file.name.endswith('.csv'):
            raise serializers.ValidationError("El archivo debe ser CSV (.csv)")
        return file


class ReporteCorreosEnviadosSerializer(serializers.ModelSerializer):
    """Serializer para listar correos enviados (nueva versión con uuid_correo)"""
    trabajadores_count = serializers.SerializerMethodField()
    estado = serializers.SerializerMethodField()

    class Meta:
        model = CorreoExamenEnviado
        fields = [
            'id',
            'uuid_correo',
            'asunto',
            'correos_destino',
            'trabajadores_count',
            'estado',
            'fecha_envio']
        read_only_fields = fields

    def get_trabajadores_count(self, obj):
        """Cuenta de trabajadores en este lote"""
        return obj.trabajadores.count()

    def get_estado(self, obj):
        """Retorna el estado del envío"""
        return "Enviado" if obj.enviado_correctamente else "Pendiente"


class DetalleCorreoMasivoSerializer(serializers.ModelSerializer):
    """Serializer para ver detalle de un envío masivo con sus trabajadores"""
    trabajadores = RegistroExamenesSerializer(many=True, read_only=True)
    estado = serializers.SerializerMethodField()
    enviado_por_nombre = serializers.CharField(
        source='enviado_por.nombrecolaborador', read_only=True)

    class Meta:
        model = CorreoExamenEnviado
        fields = [
            'id',
            'uuid_correo',
            'asunto',
            'cuerpo_correo',
            'correos_destino',
            'trabajadores',
            'estado',
            'enviado_por_nombre',
            'fecha_envio',
            'enviado_correctamente',
            'error_envio']
        read_only_fields = fields

    def get_estado(self, obj):
        return "Enviado" if obj.enviado_correctamente else "Pendiente"


class ActualizarEstadoTrabajadorSerializer(serializers.ModelSerializer):
    """Serializer para actualizar el estado_trabajador de un solo trabajador"""
    class Meta:
        model = RegistroExamenes
        fields = ['id', 'estado_trabajador']

    def validate_estado_trabajador(self, value):
        """Validar que estado_trabajador sea 0 o 1"""
        if value not in [0, 1]:
            raise serializers.ValidationError(
                "El estado debe ser 0 (Pendiente) o 1 (Completado)")
        return value


class ActualizarEstadosTrabajadoresSerializer(serializers.Serializer):
    """Serializer para actualizar el estado de múltiples trabajadores a la vez"""
    trabajadores = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            help_text="{'id': <registro_id>, 'estado_trabajador': 0 o 1}"
        ),
        help_text="Lista de trabajadores con id y estado_trabajador a actualizar"
    )

    def validate_trabajadores(self, value):
        """Validar que cada trabajador tenga id y estado_trabajador válido"""
        if not value:
            raise serializers.ValidationError(
                "La lista de trabajadores no puede estar vacía")

        for item in value:
            if 'id' not in item or 'estado_trabajador' not in item:
                raise serializers.ValidationError(
                    "Cada trabajador debe tener 'id' y 'estado_trabajador'")

            if item['estado_trabajador'] not in [0, 1]:
                raise serializers.ValidationError(
                    f"Estado inválido para trabajador {
                        item['id']}: debe ser 0 o 1")

        return value


# ============================================================================
# NUEVOS SERIALIZERS PARA LA ESTRUCTURA MEJORADA
# ============================================================================

class ExamenEnviadoSerializer(serializers.ModelSerializer):
    """Serializer para cada examen enviado a un trabajador"""
    examen_id = serializers.IntegerField(source='examen.id_examen')
    examen_nombre = serializers.CharField(source='examen.nombre')
    fecha_asignacion = serializers.DateTimeField(source='fecha_asignacion', read_only=True)
    tipo_examen = serializers.CharField(source='registro_examen.tipo_examen', read_only=True)

    class Meta:
        model = ExamenTrabajador
        fields = [
            'id',
            'examen_id',
            'examen_nombre',
            'tipo_examen',
            'fecha_asignacion'
        ]


class TrabajadorDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo para un trabajador con todos sus exámenes"""
    empresa_nombre = serializers.CharField(source='empresa.nombre_empresa')
    cargo_nombre = serializers.CharField(source='cargo.nombrecargo')
    centro_nombre = serializers.SerializerMethodField()
    examenes = ExamenEnviadoSerializer(source='examenes', many=True)
    estado_nombre = serializers.SerializerMethodField()
    ciudad = serializers.CharField(read_only=True)
    
    class Meta:
        model = RegistroExamenes
        fields = [
            'id',
            'uuid_trabajador',
            'ciudad',
            'nombre_trabajador',
            'documento_trabajador',
            'empresa',
            'empresa_nombre',
            'cargo',
            'cargo_nombre',
            'centro_nombre',
            'tipo_examen',
            'examenes_asignados',
            'examenes',
            'estado_trabajador',
            'estado_nombre',
            'fecha_registro'
        ]
    
    def get_centro_nombre(self, obj):
        if obj.centro:
            return obj.centro.nombrecentrop
        return None
    
    def get_estado_nombre(self, obj):
        return "Completado" if obj.estado_trabajador == 1 else "Pendiente"


class ReporteCorreoDetalladoSerializer(serializers.ModelSerializer):
    """Serializer para reporte de correo con información completa"""
    enviado_por_nombre = serializers.SerializerMethodField()
    trabajadores_count = serializers.SerializerMethodField()
    examenes_total = serializers.SerializerMethodField()
    tipos_examen = serializers.SerializerMethodField()
    
    class Meta:
        model = CorreoExamenEnviado
        fields = [
            'id',
            'uuid_correo',
            'asunto',
            'tipo_examen',
            'correos_destino',
            'fecha_envio',
            'enviado_correctamente',
            'enviado_por_nombre',
            'trabajadores_count',
            'examenes_total',
            'tipos_examen'
        ]
    
    def get_enviado_por_nombre(self, obj):
        return obj.enviado_por.nombrecolaborador if obj.enviado_por else "N/A"
    
    def get_trabajadores_count(self, obj):
        return obj.registros_examenes.count()
    
    def get_examenes_total(self, obj):
        """Total de exámenes enviados en este correo"""
        from examenes.models import ExamenTrabajador
        return ExamenTrabajador.objects.filter(
            registro_examen__correo_lote=obj
        ).count()
    
    def get_tipos_examen(self, obj):
        """Lista de tipos de examen únicos en este correo"""
        tipos = obj.registros_examenes.values_list('tipo_examen', flat=True).distinct()
        return list(tipos)


class ActualizarExamenTrabajadorSerializer(serializers.Serializer):
    """Serializer para actualizar el estado de un examen específico de un trabajador"""
    examen_trabajador_id = serializers.IntegerField(
        help_text="ID del registro en ExamenTrabajador"
    )
    estado = serializers.ChoiceField(
        choices=['pendiente', 'completado', 'no_realizado'],
        help_text="Nuevo estado del examen"
    )
    resultado = serializers.ChoiceField(
        choices=['aprobado', 'no_aprobado', ''],
        required=False,
        allow_blank=True,
        help_text="Resultado del examen (opcional)"
    )

    
class ActualizarEstadoExamenesSerializer(serializers.Serializer):
    trabajador_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de RegistroExamenes a actualizar"
    )



