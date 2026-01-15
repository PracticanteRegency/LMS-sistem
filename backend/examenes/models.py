from django.db import models
from analitica.models import Epresa, Centroop
from usuarios.models import Cargo, Colaboradores
import uuid
from datetime import datetime

# Create your models here.


class Examen(models.Model):
    id_examen = models.AutoField(primary_key=True, db_column='id')
    nombre = models.CharField(max_length=150, db_column='nombre')
    activo = models.BooleanField(default=1)

    class Meta:
        managed = False
        db_table = 'examenes'


class ExamenesCargo(models.Model):
    empresa = models.ForeignKey(
        Epresa,
        on_delete=models.CASCADE,
        related_name='examenes_por_cargo')
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.CASCADE,
        related_name='examenes_por_empresa')
    examen = models.ForeignKey(
        Examen,
        on_delete=models.CASCADE,
        related_name='configuraciones')
    tipo = models.CharField(
        max_length=20,
        choices=[
            ("INGRESO", "Examen de Ingreso"),
            ("PERIODICO", "Examen Periódico"),
            ("RETIRO", "Examen de Retiro"),
            ("ESPECIAL", "Examen Especial"),
            ("POST_INCAPACIDAD", "Examen Post-Incapacidad")
        ],
        default="INGRESO",
        db_index=True,
        help_text="Tipo de examen: INGRESO, PERIODICO, RETIRO, ESPECIAL o POST_INCAPACIDAD"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('empresa', 'cargo', 'examen', 'tipo')
        verbose_name = 'Examen por Empresa y Cargo'
        verbose_name_plural = 'Exámenes por Empresa y Cargo'

    def __str__(self):
        return f"{self.empresa} - {self.cargo} - {self.examen} ({self.tipo})"


class CorreoExamenEnviado(models.Model):
    """
    Tabla de control de envíos masivos de correos.
    Cada registro = 1 envío masivo (potencialmente a N trabajadores)
    Los detalles de trabajadores están en RegistroExamenes
    """
    uuid_correo = models.CharField(
        max_length=255,
        unique=True,
        editable=False,
        blank=True,
        db_index=True,
        help_text="Identificador único del lote de envío"
    )
    enviado_por = models.ForeignKey(
        Colaboradores,
        on_delete=models.PROTECT,
        related_name='correos_enviados',
        help_text="Usuario que generó el envío"
    )
    asunto = models.CharField(max_length=200, help_text="Asunto del correo")
    cuerpo_correo = models.TextField(
        help_text="Cuerpo del correo (tabla HTML)")

    # Correos quemados (EDIT AQUÍ DESPUÉS CON EMAILS REALES)
    correos_destino = models.CharField(
        max_length=500,
        default="practicante.desarrollogh@regency.com.co,practicante.desarrollogh@regency.com.co",
        help_text="Emails separados por coma donde se envía el lote"
    )

    tipo_examen = models.CharField(
        max_length=20,
        choices=[
            ("INGRESO", "Examen de Ingreso"),
            ("PERIODICO", "Examen Periódico"),
            ("RETIRO", "Examen de Retiro"),
            ("ESPECIAL", "Examen Especial"),
            ("POST_INCAPACIDAD", "Examen Post-Incapacidad"),
            ("MIXTO", "Múltiples tipos")
        ],
        default="INGRESO",
        db_index=True,
        help_text="Tipo de examen: INGRESO, PERIODICO, RETIRO, ESPECIAL, POST_INCAPACIDAD o MIXTO"
    )
    enviado_correctamente = models.BooleanField(default=False)
    error_envio = models.TextField(blank=True, null=True)
    fecha_envio = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Envío Masivo de Exámenes'
        verbose_name_plural = 'Envíos Masivos de Exámenes'
        ordering = ['-fecha_envio']

    def save(self, *args, **kwargs):
        """Generar UUID lote único con fecha del envío antes de guardar"""
        if not self.uuid_correo:
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            self.uuid_correo = f"{unique_id}-{timestamp}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Lote {self.uuid_correo} - {self.fecha_envio.strftime('%Y-%m-%d %H:%M')}"


class RegistroExamenes(models.Model):
    """
    Tabla que almacena cada trabajador que debe realizar exámenes.
    Relacionada al CorreoExamenEnviado mediante uuid_correo.
    """
    uuid_trabajador = models.CharField(
        max_length=255,
        unique=True,
        editable=False,
        blank=True,
        db_index=True,
        help_text="Identificador único del trabajador para este examen"
    )
    correo_lote = models.ForeignKey(
        CorreoExamenEnviado,
        on_delete=models.CASCADE,
        related_name='trabajadores',
        help_text="Correo/lote al que pertenece este registro"
    )
    nombre_trabajador = models.CharField(max_length=150)
    documento_trabajador = models.CharField(max_length=50, db_index=True)
    empresa = models.ForeignKey(
        Epresa,
        on_delete=models.PROTECT,
        related_name='registros_examenes'
    )
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.PROTECT,
        related_name='registros_examenes'
    )
    centro = models.ForeignKey(
        Centroop,
        on_delete=models.PROTECT,
        related_name='registros_examenes',
        null=True,
        blank=True,
        db_column='id_centro'
    )
    ciudad = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Ciudad donde se realizará el examen (opcional)"
    )
    tipo_examen = models.CharField(
        max_length=20,
        choices=[
            ("INGRESO", "Examen de Ingreso"),
            ("PERIODICO", "Examen Periódico"),
            ("RETIRO", "Examen de Retiro"),
            ("ESPECIAL", "Examen Especial"),
            ("POST_INCAPACIDAD", "Examen Post-Incapacidad")
        ],
        db_index=True,
        help_text="Tipo de examen: INGRESO, PERIODICO, RETIRO, ESPECIAL o POST_INCAPACIDAD"
    )
    examenes_asignados = models.TextField(
        blank=True,
        null=True,
        help_text="Lista de exámenes separados por coma"
    )
    estado_trabajador = models.IntegerField(
        default=0,
        choices=[(0, 'Pendiente'), (1, 'Completado')],
        help_text="Estado del trabajador: 0=Pendiente, 1=Completado"
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Registro de Exámenes'
        verbose_name_plural = 'Registros de Exámenes'
        ordering = ['-fecha_registro']
        unique_together = ('correo_lote', 'documento_trabajador')

    def save(self, *args, **kwargs):
        """Generar UUID único para el trabajador antes de guardar"""
        if not self.uuid_trabajador:
            self.uuid_trabajador = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre_trabajador} ({self.documento_trabajador}) - {self.empresa}"


class ExamenTrabajador(models.Model):
    """
    Tabla de relación muchos a muchos entre RegistroExamenes y Examen.
    Permite asociar múltiples exámenes a cada trabajador.
    """
    registro_examen = models.ForeignKey(
        RegistroExamenes,
        on_delete=models.CASCADE,
        related_name='examenes',
        help_text="Registro de exámenes del trabajador"
    )
    examen = models.ForeignKey(
        Examen,
        on_delete=models.CASCADE,
        related_name='trabajadores',
        help_text="Examen asignado"
    )
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Examen Asignado a Trabajador'
        verbose_name_plural = 'Exámenes Asignados a Trabajadores'
        unique_together = ('registro_examen', 'examen')
        ordering = ['examen__nombre']

    def __str__(self):
        return f"{self.registro_examen.nombre_trabajador} - {self.examen.nombre}"