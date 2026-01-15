from django.urls import path
from . import views

urlpatterns = [
    # Analítica
    path('progreso/', views.ProgresoEmpresarialView.as_view(), name='progreso_empresa'),
    path('progreso-filtrado/', views.ProgresoEmpresarialFiltradoView.as_view(), name='progreso_empresa_filtro'),
    
    # Empresa (legacy aliases) 
    path('empresa/', views.EmpresaCreateView.as_view(), name='crear_empresa'),
    path('ver-empresa/<int:pk>/', views.VerEmpresaView.as_view(), name='ver_empresa'),
    path('lista-empresas/', views.ListaEmpresasView.as_view(), name='lista_empresas'),
    
    # Unidad de negocio 
    path('crear-unidad-negocio/', views.UnidadNegocioCreateView.as_view(), name='crear_unidad_negocio'),
    path('ver-unidad-negocio/<int:pk>/', views.VerUnidadNegocioView.as_view(), name='ver_unidad_negocio'),
    path('lista-unidades-negocio/', views.ListaUnidadesNegocioView.as_view(), name='lista_unidades_negocio'),
    # Proyectos 
    path('crear-proyecto/', views.ProyectoCreateView.as_view(), name='crear_proyecto'),
    path('ver-proyecto/<int:pk>/', views.VerProyectoView.as_view(), name='ver_proyecto'),
    path('proyectos/', views.ListaProyectosView.as_view(), name='lista_proyectos'),
    
    # Centros operativos 
    path('crear-centro-operativo/', views.CentroOperativoCreateView.as_view(), name='crear_centro_operativo'),
    path('ver-centro-operativo/<int:pk>/', views.VerCentroOperativoView.as_view(), name='ver_centro_operativo'),
    path('lista-centros-operativos/', views.ListaCentrosOperativosView.as_view(), name='lista_centros_operativos'),

    # Carga masiva
    path('cargarDatosEmpresa/', views.CargarEstructuraView.as_view(), name='cargar-datos-empresa'),
]
