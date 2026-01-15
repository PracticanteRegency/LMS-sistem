from django.urls import path
from capacitaciones import views

urlpatterns = [
    path('crear-capacitacion/', views.CrearCapacitacionView.as_view(), name='crear-capacitacion'),
    path('crear-capacitacion/<int:capacitacion_id>/', views.CrearCapacitacionView.as_view(), name='editar-capacitacion'),
    path('capacitaciones/', views.CapacitacionesView.as_view(), name='capacitaciones'),
    path('capacitacion/<int:capacitacion_id>/', views.CapacitacionDetailView.as_view(), name='capacitacion-detalle'),
    path('progreso/registrar/', views.RegistrarProgresoView.as_view(), name='registrar-progreso'),
    path('leccion/<int:leccion_id>/completar/', views.CompletarLeccionView.as_view(), name='completar-leccion'),
    path('leccion/<int:leccion_id>/responder/', views.ResponderCuestionarioView.as_view(), name='responder-cuestionario'),
    path('cargar/', views.PrevisualizarColaboradoresView.as_view(), name='cargar-colaborador'),
    path('subir-archivoImagen/', views.CargarArchivoView.as_view(), name='cargar-archivoImagen'),
    path('certificado/<int:id_capacitacion>/', views.DescargarCertificadoView.as_view(), name='certificado'),
    path('<int:capacitacion_id>/', views.MisCapacitacionesView.as_view(), name='capacitacion_individual'),
    path('mis-capacitaciones/', views.MisCapacitacionesListView.as_view(), name='mis-capacitaciones'),
]
