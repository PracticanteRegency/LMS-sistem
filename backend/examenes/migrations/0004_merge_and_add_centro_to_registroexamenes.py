from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('examenes', '0003_add_uuid_lote_and_registro_examenes'),
        ('examenes', '0003_alter_correoexamenenviado_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='registroexamenes',
            name='centro',
            field=models.ForeignKey(
                to='analitica.centroop',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='registros_examenes',
                null=True,
                blank=True,
                db_column='id_centro',
            ),
        ),
    ]
