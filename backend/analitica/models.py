# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Epresa(models.Model):
    idempresa = models.AutoField(db_column='Idempresa', primary_key=True)  # Field name made lowercase.
    nitempresa = models.CharField(max_length=20)
    nombre_empresa = models.CharField(max_length=150)
    estadoempresa = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'epresa'


class Unidadnegocio(models.Model):
    idunidad = models.AutoField(primary_key=True)
    nombreunidad = models.CharField(max_length=30)
    descripcionunidad = models.CharField(db_column='descripcionUnidad', max_length=100)  # Field name made lowercase.
    estadounidad = models.IntegerField(db_column='estadoUnidad')  # Field name made lowercase.
    id_empresa = models.ForeignKey(Epresa, models.DO_NOTHING, db_column='id_empresa', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'unidadnegocio'


class Proyecto(models.Model):
    idproyecto = models.AutoField(db_column='Idproyecto', primary_key=True)  # Field name made lowercase.
    nombreproyecto = models.CharField(db_column='nombreProyecto', max_length=50)  # Field name made lowercase.
    estadoproyecto = models.IntegerField(db_column='estadoProyecto', blank=True, null=True)  # Field name made lowercase.
    id_unidad = models.ForeignKey(Unidadnegocio, models.DO_NOTHING, db_column='id_unidad', blank=True, null=True)
    idcolaborador = models.ForeignKey('usuarios.Colaboradores', models.DO_NOTHING, db_column='idColaborador', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'proyecto'


class Centroop(models.Model):
    idcentrop = models.AutoField(db_column='idCentrOp', primary_key=True)  # Field name made lowercase.
    nombrecentrop = models.CharField(db_column='nombreCentrOp', max_length=30)  # Field name made lowercase.
    estadocentrop = models.IntegerField(db_column='estadoCentrOp')  # Field name made lowercase.
    id_proyecto = models.ForeignKey(Proyecto, models.DO_NOTHING, db_column='Id_proyecto')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'centroop'