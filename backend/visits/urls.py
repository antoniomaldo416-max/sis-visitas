from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VisitsPlaceholderAPIView,
    CitizenViewSet,
    VisitCaseViewSet,
    VisitViewSet,
    PhotoUploadAPIView,
    SearchAPIView,
    dashboard_stats,  
)

# --- Rutas automáticas con router ---
router = DefaultRouter()
router.register(r"citizens", CitizenViewSet, basename="citizen")
router.register(r"cases", VisitCaseViewSet, basename="visitcase")
router.register(r"visits", VisitViewSet, basename="visit")

# --- Rutas manuales adicionales ---
urlpatterns = [
    path("placeholder/", VisitsPlaceholderAPIView.as_view(), name="visits-placeholder"),
    path("photos/upload/", PhotoUploadAPIView.as_view(), name="photo-upload"),
    path("search/", SearchAPIView.as_view(), name="visits-search"),

 
    path("dashboard-stats/", dashboard_stats, name="dashboard-stats"),

    # Incluye las rutas del router
    path("", include(router.urls)),
]
