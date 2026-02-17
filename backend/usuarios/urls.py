from django.urls import path
from usuarios import views

urlpatterns = [
    path("register/", views.Register.as_view(), name="register"),
    path("register/<int:colaborador_id>/", views.Register.as_view(), name="register"),
    path("registerTemporal/", views.RegisterTemporal.as_view(), name="register_temporal"),
    path('registrar-masivo/', views.RegistrarMasivoView.as_view(), name='registrar-masivo'),
    path("perfil/", views.Perfil.as_view(), name="perfil"),
    # Perfil por colaborador (mantener ambos nombres por compatibilidad)
    path("perfil/<int:id>/", views.Perfil.as_view(), name="perfil-especifico"),
    path("lista-usuarios/", views.ListaUsuarios.as_view(), name="lista_usuarios"),
    path("perfil/<int:colaborador_id>/capacitacion/<int:capacitacion_id>/",views.PerfilCapacitacionView.as_view()),
    path("cargo-Nivel-Regional/", views.CargoNivelRegionalView.as_view(), name="cargo-nivel-regional"),
    path("filtrar-usuarios/", views.FiltrarUsuariosView.as_view(), name="filtrar-usuarios"),
    path("cambiar-estado-usuario/", views.CambiarEstadoUsuarioView.as_view(), name="cambiar-estado-usuario-post"),
    path("cambiar-estado-usuario/<int:colaborador_id>/", views.CambiarEstadoUsuarioView.as_view(), name="cambiar-estado-usuario"),
    path("actualizar-rol-usuario/<int:colaborador_id>/", views.ActualizarRolUsuarioView.as_view(), name="actualizar-rol-usuario"),
    path("Cargo/", views.DatosCargoView.as_view(), name="datos-cargo"),
    path("Nivel/", views.DatosNivelView.as_view(), name="datos-nivel"),
    path("Region/", views.DatosRegionView.as_view(), name="datos-region"),
    path("reporte-usuarios/", views.ReporteUsuariosView.as_view(), name="reporte-usuarios"),
]

