from django.urls import path
from examenes import views

urlpatterns = [
    path('cargo-empresa-examenes/',views.CargoEmpresaConExamenesView.as_view(),name='cargo-empresa-examenes'),
    path('correo/enviar/',views.EnviarCorreoView.as_view(),name='enviar-correo'),
    path('correo/enviar-masivo/', views.EnviarCorreoMasivoView.as_view(), name='enviar-correo-masivo'),
    path('correo/reporte/', views.ReporteCorreosEnviadosView.as_view(), name='reporte-correos'),
    path('correo/detalle/<int:correo_id>/', views.DetalleCorreoEnviadoView.as_view(), name='detalle-correo'),
    path('correo/<int:correo_id>/trabajadores/', views.ListarTrabajadoresCorreoView.as_view(), name='listar-trabajadores-correo'),
    path('imprimir-reporte/', views.ImprimirReporteCorreosView.as_view(), name='imprimir-reporte'),
    path('registros-por-tipo/', views.ListarRegistrosPorTipoExamenView.as_view(), name='registros-por-tipo'),
    path('actualizar-estado/', views.ActualizarEstadoExamenesMasivoView.as_view(), name='actualizar-estado-examenes-masivo'),
]
