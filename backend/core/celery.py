from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

redis_host = os.environ.get('REDIS_HOST', 'localhost')
app.conf.broker_url = f'redis://{redis_host}:6379/0'
app.conf.result_backend = f'redis://{redis_host}:6379/0'

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks(['notificaciones', 'capacitaciones', 'examenes'])

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

app.conf.beat_schedule = {
    # ── BLOQUE 1: Activación + correo (06:00) ──────────────────────────
    # Esta tarea puede enviar MUCHOS correos (1500+). Se ejecuta temprano
    # para tener la hora completa sin competir con otras tareas.
    'enviar-correo-y-activar-capacitaciones-cada-dia': {
        'task': 'notificaciones.tasks.enviar_correo_capacitaciones_activas_y_activar',
        'schedule': crontab(hour=6, minute=0),  # 06:00 — sola en su franja horaria
    },

    # ── BLOQUE 2: Notificación 7 días (10:00) ──────────────────────────
    # Separada 4 horas del bloque 1 para no competir por el límite/hora.
    'notificar-capacitaciones-7-dias': {
        'task': 'notificaciones.tasks.notificar_capacitacion_por_vencer_7_dias',
        'schedule': crontab(hour=10, minute=0),  # 10:00
    },

    # ── BLOQUE 3: Notificación 1 día (14:00) ───────────────────────────
    # Separada 4 horas del bloque 2.
    'notificar-capacitaciones-1-dia': {
        'task': 'notificaciones.tasks.notificar_capacitacion_por_vencer_1_dia',
        'schedule': crontab(hour=14, minute=0),  # 14:00
    },

    # ── BLOQUE 4: Notificar jefes (lunes 18:00) ────────────────────────
    # Los lunes a las 18:00, bien separado de los demás.
    'notificar-jefes-sin-progreso': {
        'task': 'notificaciones.tasks.notificar_jefes_por_colaboradores_sin_progreso',
        'schedule': crontab(hour=10, minute=0, day_of_week='monday'),  # Lunes 10:00
    },

    # ── Tareas sin envío de correos (no afectan límite) ─────────────────
    'desactivar-capacitaciones-cada-dia': {
        'task': 'notificaciones.tasks.desactivar_capacitaciones',
        'schedule': crontab(hour=23, minute=59),
    },
    'limpiar-certificados-antiguos': {
        'task': 'capacitaciones.tasks.limpiar_certificados_antiguos',
        'schedule': crontab(hour=8, minute=3, day_of_week='sunday'),
    },
    'limpiar-directorio-certificados': {
        'task': 'capacitaciones.tasks.limpiar_directorio_certificados',
        'schedule': crontab(hour=8, minute=0, day_of_week='sunday'),
    },
}

app.conf.timezone = 'America/Bogota'
