from django.db import migrations

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS certificados_generados (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    colaborador_id INT NOT NULL,
    capacitacion_id INT NOT NULL,
    archivo_pdf VARCHAR(255) NOT NULL,
    fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY certificado_unico (colaborador_id, capacitacion_id),
    INDEX idx_colab_cap (colaborador_id, capacitacion_id),
    INDEX idx_fecha_gen (fecha_generacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

DROP_TABLE_SQL = """
DROP TABLE IF EXISTS certificados_generados;
"""

class Migration(migrations.Migration):

    dependencies = [
        ('capacitaciones', '0003_certificadogenerado'),
    ]

    operations = [
        migrations.RunSQL(
            sql=CREATE_TABLE_SQL,
            reverse_sql=DROP_TABLE_SQL,
        ),
    ]
