"""
Migration para cambiar is_staff de BooleanField a IntegerField
con los nuevos tipos de usuario.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        # Primero convertir el campo de Boolean a IntegerField
        migrations.AlterField(
            model_name='usuarios',
            name='is_staff',
            field=models.IntegerField(
                choices=[(0, 'Usuario Normal'), (1, 'Administrador'), (2, 'Usuario con Lectura Admin'), (3, 'Usuario Especial')],
                db_column='tipousuario',
                default=0
            ),
        ),
    ]
