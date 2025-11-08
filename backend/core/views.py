from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from visits.models import Visit  # 👈 Asegúrate de que el modelo esté en 'visits.models' (ajusta si está en otro app)

# --- Vista de prueba (ya estaba) ---
def healthcheck(request):
    return JsonResponse({"status": "ok"}, status=200)


# --- NUEVA VISTA: Estadísticas del Dashboard ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Devuelve estadísticas generales para el panel de control.
    """
    today = timezone.now().date()

    # Total de visitantes activos (sin salida)
    total_activos = Visit.objects.filter(checkout_at__isnull=True).count()

    # Total de entradas registradas hoy
    total_entradas = Visit.objects.filter(checkin_at__date=today).count()

    # Total de salidas registradas hoy
    total_salidas = Visit.objects.filter(checkout_at__date=today).count()

    # Calcular promedio de tiempo de visita (en minutos)
    visitas_con_salida = Visit.objects.filter(checkout_at__isnull=False)
    duraciones = [
        (v.checkout_at - v.checkin_at).total_seconds() / 60
        for v in visitas_con_salida
        if v.checkin_at and v.checkout_at
    ]
    promedio = round(sum(duraciones) / len(duraciones), 1) if duraciones else 0

    return Response({
        'activos': total_activos,
        'entradas_hoy': total_entradas,
        'salidas_hoy': total_salidas,
        'promedio_min': promedio,
    })
