from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('capacitaciones', '0004_create_certificados_generados'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE lecciones ADD COLUMN duracion VARCHAR(20) NULL;",
            reverse_sql="ALTER TABLE lecciones DROP COLUMN duracion;",
        ),
    ]
