# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, UserManager


class Colaboradores(models.Model):
    idcolaborador = models.AutoField(primary_key=True, db_column='idColaborador')  # Field name made lowercase.
    cccolaborador = models.CharField(max_length=30, null=False, blank=True, unique=True, db_column='ccColaborador')  # Field name made lowercase.
    nombrecolaborador = models.CharField(max_length=30, db_column='nombreColaborador')  # Field name made lowercase.
    apellidocolaborador = models.CharField(max_length=30, db_column='apellidoColaborador')  # Field name made lowercase.
    centroop = models.ForeignKey('analitica.Centroop', models.SET_NULL, null=True, db_column='id_centroop')  # Field name made lowercase.
    cargocolaborador = models.ForeignKey('Cargo', models.SET_NULL, null=True, db_column='cargoColaborador')  # Field name made lowercase.
    correocolaborador = models.CharField(max_length=50, blank=True, null=True, db_column='correoColaborador')  # Field name made lowercase.
    telefocolaborador = models.CharField(max_length=20, blank=True, null=True, db_column='telefoColaborador')  # Field name made lowercase.
    estadocolaborador = models.IntegerField(default=1)  # Field name made lowercase.
    nivelcolaborador = models.ForeignKey('Niveles', models.SET_NULL, null=True, db_column='nivelcolaborador')
    regionalcolab = models.ForeignKey('Regional', models.SET_NULL, blank=True, null=True, db_column='regionalcolab')

    class Meta:
        managed = False
        db_table = 'colaboradores'


class Cargo(models.Model):
    idcargo = models.AutoField(primary_key=True)  # Field name made lowercase.
    nombrecargo = models.CharField(max_length=30)  # Field name made lowercase.
    estadocargo = models.IntegerField(default=1)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'cargo'


class Niveles(models.Model):
    idnivel = models.AutoField(primary_key=True)
    nombrenivel = models.CharField(max_length=50)
    estadonivel = models.IntegerField(default=1)
    prom = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'niveles'


class Usuarios(AbstractBaseUser):
    id = models.AutoField(primary_key=True, db_column='idusuario')  # Field name made lowercase.
    usuario = models.CharField(max_length=30, null=True, blank=True, unique=True)
    password = models.CharField(max_length=500, db_column='clave')  # Field name made lowercase.
    idcolaboradoru = models.ForeignKey(Colaboradores, models.DO_NOTHING, null=True, db_column='idcolaboradoru')  # Field name made lowercase.
    estadousuario = models.IntegerField(default=1)  # Field name made lowercase.
    tipousuario = models.IntegerField()

    objects = UserManager()

    USERNAME_FIELD = 'usuario'
    REQUIRED_FIELDS = [
        'password'
    ]

    @property
    def is_staff(self):
        """Retorna True si es admin o super admin para acceso al admin de Django"""
        return self.tipousuario in [1, 4]
    
    @property
    def is_superuser(self):
        """Retorna True si es super admin"""
        return self.tipousuario == 4
    
    @property
    def is_active(self):
        """Retorna True si el usuario está activo"""
        return self.estadousuario == 1
    
    def has_perm(self, perm, obj=None):
        """Retorna True si el usuario tiene el permiso especificado"""
        return self.tipousuario in [1, 4]
    
    def has_module_perms(self, app_label):
        """Retorna True si el usuario tiene permisos para ver el módulo"""
        return self.tipousuario in [1, 4]

    class Meta:
        managed = False
        db_table = 'usuarios'


class Regional(models.Model):
    idregional = models.AutoField(primary_key=True)
    nombreregional = models.CharField(max_length=30)
    estadoregional = models.IntegerField(default=1)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'regional'
