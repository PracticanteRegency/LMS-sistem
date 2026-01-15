from django.db import models
from usuarios.models import Colaboradores

class Notificacion(models.Model):
    colaborador = models.ForeignKey(Colaboradores, on_delete=models.CASCADE, related_name='notificaciones')
    titulo = models.CharField(max_length=255)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notificaciones'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.colaborador.nombre_colaborador} - {self.titulo}"