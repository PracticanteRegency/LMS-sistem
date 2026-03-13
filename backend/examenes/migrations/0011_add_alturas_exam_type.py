# Generated migration to add ALTURAS exam type

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('examenes', '0009_remove_registroexamenes_examenes_realizados_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='examenescargo',
            name='tipo',
            field=models.CharField(
                choices=[
                    ('INGRESO', 'Examen de Ingreso'),
                    ('PERIODICO', 'Examen Periódico'),
                    ('RETIRO', 'Examen de Retiro'),
                    ('ESPECIAL', 'Examen Especial'),
                    ('POST_INCAPACIDAD', 'Examen Post-Incapacidad'),
                    ('ALTURAS', 'Examen con énfasis en alturas')
                ],
                db_index=True,
                default='INGRESO',
                help_text='Tipo de examen: INGRESO, PERIODICO, RETIRO, ESPECIAL, POST_INCAPACIDAD o ALTURAS',
                max_length=20
            ),
        ),
        migrations.AlterField(
            model_name='correoexamenenviado',
            name='tipo_examen',
            field=models.CharField(
                choices=[
                    ('INGRESO', 'Examen de Ingreso'),
                    ('PERIODICO', 'Examen Periódico'),
                    ('RETIRO', 'Examen de Retiro'),
                    ('ESPECIAL', 'Examen Especial'),
                    ('POST_INCAPACIDAD', 'Examen Post-Incapacidad'),
                    ('ALTURAS', 'Examen con énfasis en alturas'),
                    ('MIXTO', 'Múltiples tipos')
                ],
                db_index=True,
                default='INGRESO',
                help_text='Tipo de examen: INGRESO, PERIODICO, RETIRO, ESPECIAL, POST_INCAPACIDAD, ALTURAS o MIXTO',
                max_length=20
            ),
        ),
        migrations.AlterField(
            model_name='registroexamenes',
            name='tipo_examen',
            field=models.CharField(
                choices=[
                    ('INGRESO', 'Examen de Ingreso'),
                    ('PERIODICO', 'Examen Periódico'),
                    ('RETIRO', 'Examen de Retiro'),
                    ('ESPECIAL', 'Examen Especial'),
                    ('POST_INCAPACIDAD', 'Examen Post-Incapacidad'),
                    ('ALTURAS', 'Examen con énfasis en alturas')
                ],
                db_index=True,
                help_text='Tipo de examen: INGRESO, PERIODICO, RETIRO, ESPECIAL, POST_INCAPACIDAD o ALTURAS',
                max_length=20
            ),
        ),
    ]
