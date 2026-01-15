# This is an auto-generated Django model module.
from django.db import models
from django.utils import timezone


class Capacitaciones(models.Model):
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField()
    imagen = models.TextField(max_length=300)
    estado = models.IntegerField()
    fecha_creacion = models.DateTimeField(blank=True, null=True, default= timezone.now)
    fecha_inicio = models.DateTimeField(blank=True, null=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    tipo = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'capacitaciones'


class Modulos(models.Model):
    nombremodulo = models.CharField(db_column='nombreModulo', max_length=150)
    idcapacitacion = models.ForeignKey(Capacitaciones, models.DO_NOTHING, db_column='idCapacitacion')

    class Meta:
        managed = False
        db_table = 'modulos'


class Lecciones(models.Model):
    tituloleccion = models.CharField(db_column='tituloLeccion', max_length=150)
    tipoleccion = models.CharField(db_column='tipoLeccion', max_length=150)
    url = models.TextField(db_column='URL')
    idmodulo = models.ForeignKey(Modulos, models.DO_NOTHING, db_column='idModulo')

    class Meta:
        managed = False
        db_table = 'lecciones'


class PreguntasLecciones(models.Model):
    pregunta = models.TextField()
    tipopregunta = models.CharField(db_column='tipoPregunta', max_length=150)
    urlmultimedia = models.TextField(db_column='urlMultimedia')
    id_leccion = models.ForeignKey(Lecciones, models.DO_NOTHING, db_column='id_leccion')

    class Meta:
        managed = False
        db_table = 'preguntas_lecciones'


class Respuestas(models.Model):
    idpregunta = models.ForeignKey(PreguntasLecciones, models.DO_NOTHING, db_column='idPregunta')
    valor = models.TextField()
    escorrecto = models.IntegerField(db_column='esCorrecto')
    urlimagen = models.TextField(db_column='urlImagen')

    class Meta:
        managed = False
        db_table = 'respuestas'


class progresoCapacitaciones(models.Model):
    capacitacion = models.ForeignKey(Capacitaciones, models.DO_NOTHING)
    colaborador = models.ForeignKey('usuarios.Colaboradores', models.DO_NOTHING)
    fecha_registro = models.DateTimeField(default= timezone.now)
    completada = models.IntegerField()
    progreso = models.DecimalField(max_digits=10, decimal_places=0)
    fecha_completada = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'capacitaciones_colaboradores'


class progresolecciones(models.Model):
    id_progreso = models.AutoField(primary_key=True)
    idcolaborador = models.ForeignKey('usuarios.Colaboradores', models.DO_NOTHING, db_column='idColaborador')
    idleccion = models.ForeignKey(Lecciones, models.DO_NOTHING, db_column='idLeccion')
    completada = models.IntegerField(blank=True, null=True)
    fecha_completado = models.DateTimeField(blank=True, null=True)
    progreso = models.DecimalField(max_digits=10, decimal_places=0)

    class Meta:
        managed = False
        db_table = 'progreso_colaboradores'
        unique_together = (('idcolaborador', 'idleccion'),)


class progresoModulo(models.Model):
    colaborador = models.ForeignKey('usuarios.Colaboradores', models.DO_NOTHING, db_column='colaborador')
    modulo = models.ForeignKey(Modulos, models.DO_NOTHING, db_column='modulo')
    completada = models.IntegerField(blank=True, null=True)
    progreso = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    fecha_completado = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'progreso_modulo'


class RespuestasColaboradores(models.Model):
    idcolaborador = models.ForeignKey('usuarios.Colaboradores', models.DO_NOTHING, db_column='idColaborador')
    idpregunta = models.ForeignKey(PreguntasLecciones, models.DO_NOTHING, db_column='idPregunta')
    idrespuesta = models.ForeignKey(Respuestas, models.DO_NOTHING, db_column='idRespuesta')

    class Meta:
        managed = False
        db_table = 'respuestas_colaboradores'


class CertificadoGenerado(models.Model):
    colaborador_id = models.IntegerField(db_column='colaborador_id')
    capacitacion_id = models.IntegerField(db_column='capacitacion_id')
    archivo_pdf = models.FileField(upload_to='certificados_generados/%Y/%m/%d/', db_column='archivo_pdf')
    fecha_generacion = models.DateTimeField(auto_now_add=True, db_column='fecha_generacion')
    fecha_actualizacion = models.DateTimeField(auto_now=True, db_column='fecha_actualizacion')

    class Meta:
        db_table = 'certificados_generados'
        unique_together = (('colaborador_id', 'capacitacion_id'),)
        indexes = [
            models.Index(fields=['colaborador_id', 'capacitacion_id']),
            models.Index(fields=['fecha_generacion']),
        ]
