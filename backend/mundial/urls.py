from django.urls import path
from mundial import views

urlpatterns = [
    # ── Ediciones del mundial ────────────────────────────────────
    path("ediciones/", views.EdicionMundialListCreateView.as_view(), name="edicion-list-create"),
    path("ediciones/<int:pk>/", views.EdicionMundialDetailView.as_view(), name="edicion-detail"),

    # ── Equipos ──────────────────────────────────────────────────
    path("equipos/", views.EquipoListCreateView.as_view(), name="equipo-list-create"),
    path("equipos/<int:pk>/", views.EquipoDetailView.as_view(), name="equipo-detail"),

    # ── Partidos (vista usuario con mi_prediccion) ────────────────
    path("partidos/", views.PartidoListCreateView.as_view(), name="partido-list-create"),
    path("partidos/<int:pk>/", views.PartidoDetailView.as_view(), name="partido-detail"),
    path("partidos/<int:pk>/resultado/", views.PartidoResultadoView.as_view(), name="partido-resultado"),

    # ── Partidos (vista admin con estadísticas de control) ────────
    path("admin/partidos/", views.PartidoAdminListView.as_view(), name="partido-admin-list"),

    # ── Predicciones de partidos ──────────────────────────────────
    path("predicciones/", views.PrediccionListCreateView.as_view(), name="prediccion-list-create"),

    # ── Predicciones especiales ───────────────────────────────────
    path("predicciones-especiales/", views.PrediccionEspecialListCreateView.as_view(), name="prediccion-especial-list-create"),

    # ── Ranking ───────────────────────────────────────────────────
    path("ranking/", views.RankingView.as_view(), name="ranking"),

    # ── Configuración del torneo ──────────────────────────────────
    path("configuracion/", views.ConfiguracionTorneoView.as_view(), name="configuracion-torneo"),

    # ── Configuración predicciones especiales ─────────────────────
    path("configuracion-especiales/", views.ConfiguracionPrediccionEspecialListView.as_view(), name="config-especiales-list"),
    path("configuracion-especiales/<int:pk>/", views.ConfiguracionPrediccionEspecialDetailView.as_view(), name="config-especiales-detail"),

    # ── Estadísticas ──────────────────────────────────────────────
    path("estadisticas/", views.EstadisticasView.as_view(), name="estadisticas"),
]
