from django.urls import path
from .views import EnviarCorreoView

urlpatterns = [
    path('enviar-correo/', EnviarCorreoView.as_view(), name='enviar-correo'),
]