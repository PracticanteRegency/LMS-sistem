from django.urls import path
from usuarios import views

urlpatterns = [
    path("register/", views.Register.as_view(), name="register"),
    path("registerTemporal/", views.RegisterTemporal.as_view(), name="register_temporal"),
    path("perfil/", views.Perfil.as_view(), name="perfil"),
    # Perfil por colaborador (mantener ambos nombres por compatibilidad)
    path("perfil/<int:id>/", views.Perfil.as_view(), name="perfil-especifico"),
    path("lista-usuarios/", views.ListaUsuarios.as_view(), name="lista_usuarios"),
    path("perfil/<int:colaborador_id>/capacitacion/<int:capacitacion_id>/",views.PerfilCapacitacionView.as_view()),
    path("cargo-Nivel-Regional/", views.CargoNivelRegionalView.as_view(), name="cargo-nivel-regional"),
]

