from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Usar Redis como broker en lugar de RabbitMQ por defecto
redis_host = os.environ.get('REDIS_HOST', 'localhost')
app.conf.broker_url = f'redis://{redis_host}:6379/0'
app.conf.result_backend = f'redis://{redis_host}:6379/0'

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks(['notificaciones', 'capacitaciones', 'analitica'])

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

app.conf.beat_schedule = {
    'enviar-correo-y-activar-capacitaciones-cada-dia': {
        'task': 'notificaciones.tasks.enviar_correo_capacitaciones_activas_y_activar',
        'schedule': crontab(hour=12, minute=0),  # Cada día a las 12:00 - Activa + envía correo
    },
    'notificar-capacitaciones-7-dias': {
        'task': 'notificaciones.tasks.notificar_capacitacion_por_vencer_7_dias',
        'schedule': crontab(hour=7, minute=0),  # Cada día a las 07:00
    },
    'notificar-capacitaciones-1-dia': {
        'task': 'notificaciones.tasks.notificar_capacitacion_por_vencer_1_dia',
        'schedule': crontab(hour=7, minute=30),  # Cada día a las 07:30
    },
    'desactivar-capacitaciones-cada-dia': {
        'task': 'notificaciones.tasks.desactivar_capacitaciones',
        'schedule': crontab(hour=23, minute=59),  # Cada día a las 23:59
    },
    'notificar-jefes-sin-progreso': {
        'task': 'notificaciones.tasks.notificar_jefes_por_colaboradores_sin_progreso',
        'schedule': crontab(hour=9, minute=0, day_of_week='monday'),  # Lunes a las 09:00
    },
    'calcular-progreso-empresarial-diario': {
        'task': 'analitica.tasks.calcular_progreso_empresarial_diario',
        'schedule': crontab(hour=0, minute=0),  # Cada día a las 00:00
    },
}

app.conf.timezone = 'America/Bogota'
