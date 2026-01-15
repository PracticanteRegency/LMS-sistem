from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

app.conf.beat_schedule = {
    'enviar-correo-capacitaciones-activas-cada-dia': {
        'task': 'notificaciones.tasks.enviar_correo_capacitaciones_activas',
        'schedule': crontab(hour=8, minute=0),  
    },
    'notificar-capacitaciones-7-dias': {
        'task': 'notificaciones.tasks. ',
        'schedule': crontab(hour=7, minute=0),
    },
    'notificar-capacitaciones-1-dia': {
        'task': 'notificaciones.tasks.notificar_capacitacion_por_vencer_1_dia',
        'schedule': crontab(hour=7, minute=30),
    },
    'activar-capacitaciones-cada-dia': {
        'task': 'notificaciones.tasks.activar_capacitaciones',
        'schedule': crontab(hour=12, minute=0),
    },
    'desactivar-capacitaciones-cada-dia': {
        'task': 'notificaciones.tasks.desactivar_capacitaciones',
        'schedule': crontab(hour=23, minute=59),
    },
        'notificar-jefes-proyectos-capacitaciones-no-completadas': {
        'task': 'notificaciones.tasks.notificar_jefes_proyectos_capacitaciones_no_completadas',
        'schedule': crontab(hour=9, minute=0, day_of_week='monday'),
    },
    'calcular-progreso-empresarial-diario': {
        'task': 'analitica.tasks.calcular_progreso_empresarial_diario',
        'schedule': crontab(hour=0, minute=0),  # Cada día a las 00:00
    },
}

app.conf.timezone = 'America/Bogota'
