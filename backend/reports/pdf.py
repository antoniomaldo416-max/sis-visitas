from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.utils.timezone import localtime  # 👈 para mostrar hora local


# --- Formateadores ---
def _fmt_dt(dt):
    """Convierte fecha/hora a formato legible local (YYYY-MM-DD HH:MM)."""
    if not dt:
        return ""
    try:
        # Convierte a hora local de Guatemala antes de formatear
        dt_local = localtime(dt)
    except Exception:
        dt_local = dt
    return dt_local.strftime("%Y-%m-%d %H:%M")


def _fmt_ident(citizen):
    """Devuelve DPI o pasaporte."""
    return citizen.dpi or citizen.passport or ""


def _build_table_rows(visits):
    """Construye las filas de la tabla del reporte."""
    rows = [
        ["Fecha ingreso", "Ciudadano", "Identificación", "Tema", "Unidad destino", "Badge", "Salida"]
    ]
    for v in visits:
        c = v.case.citizen
        t = v.case.topic
        rows.append([
            _fmt_dt(v.checkin_at),
            c.name,
            _fmt_ident(c),
            f"{t.code} - {t.name}",
            v.target_unit or "",
            v.badge_code or "",
            _fmt_dt(v.checkout_at) if v.checkout_at else "",
        ])
    return rows


# --- Generador principal del PDF ---
def render_visits_report_pdf(title: str, subtitle_lines: list[str], visits, total: int) -> bytes:
    """Genera el PDF del reporte de visitas."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=landscape(A4),
        leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=12 * mm
    )

    styles = getSampleStyleSheet()
    story = []

    # Encabezado
    story.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
    for line in subtitle_lines:
        story.append(Paragraph(line, styles["Normal"]))
    story.append(Spacer(1, 6))

    story.append(Paragraph(f"<b>Total de visitas:</b> {total}", styles["Heading3"]))
    story.append(Spacer(1, 6))

    # Tabla de datos
    rows = _build_table_rows(visits)
    table = Table(rows, repeatRows=1)

    table.setStyle(TableStyle([
        # Encabezado
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1565c0")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),

        # Cuerpo
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

        # Alternancia de color de filas
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#f0f4f8")]),
    ]))

    story.append(table)

    # Construir el documento
    doc.build(story)
    pdf = buf.getvalue()
    buf.close()
    return pdf
