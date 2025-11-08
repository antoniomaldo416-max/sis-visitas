from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from core.views import healthcheck
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from django.conf import settings
from django.conf.urls.static import static
from users.views import LoginView


# ✅ Vista para la raíz (Render /)
def home(request):
    return JsonResponse({
        "status": "ok",
        "message": "Backend activo en Render 🚀",
        "api_endpoints": {
            "health": "/api/health/",
            "users": "/api/users/",
            "visits": "/api/visits/",
            "reports": "/api/reports/",
        }
    })


urlpatterns = [
    path("", home, name="home"),  # ✅ raíz del sitio
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck, name="healthcheck"),

    # OpenAPI / Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # Apps
    path("api/users/", include("users.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/visits/", include("visits.urls")),
    path("api/auditlog/", include("auditlog.urls")),
    path("api/reports/", include("reports.urls")),

    # Auth (JWT)
    path("api/auth/jwt/create/", LoginView.as_view(), name="jwt-create"),
    path("api/auth/jwt/refresh/", TokenRefreshView.as_view(), name="jwt-refresh"),
    path("api/auth/jwt/verify/", TokenVerifyView.as_view(), name="jwt-verify"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
