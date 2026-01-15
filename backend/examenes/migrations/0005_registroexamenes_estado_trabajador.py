# Generated migration for adding estado_trabajador field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('examenes', '0004_merge_and_add_centro_to_registroexamenes'),
    ]

    operations = [
        migrations.AddField(
            model_name='registroexamenes',
            name='estado_trabajador',
            field=models.IntegerField(choices=[(0, 'Pendiente'), (1, 'Completado')], default=0, help_text='Estado del trabajador: 0=Pendiente, 1=Completado'),
        ),
    ]
