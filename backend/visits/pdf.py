from io import BytesIO
import os
from datetime import datetime
from urllib.parse import quote
from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet


BADGE_WIDTH = 90 * mm
BADGE_HEIGHT = 60 * mm
HEADER_H = 16 * mm
FOOTER_H = 11 * mm
MARGIN = 5 * mm

PHOTO_W = 26 * mm
PHOTO_H = 26 * mm
QR_SIZE = 26 * mm
GUTTER = 6 * mm


def _img_reader(abs_path: str):
    try:
        if abs_path and os.path.exists(abs_path):
            return ImageReader(abs_path)
    except Exception:
        pass
    return None


def _p_style(font="Helvetica", size=9, leading=None, bold=False, color=colors.black, align="left"):
    styles = getSampleStyleSheet()
    return ParagraphStyle(
        "badge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold" if bold else font,
        fontSize=size,
        leading=leading or (size + 2),
        textColor=color,
        alignment={"left": 0, "center": 1, "right": 2}.get(align, 0),
    )


def _draw_paragraph(c, text, x, y, width, style):
    p = Paragraph(text, style)
    p.wrapOn(c, width, 1000)
    p.drawOn(c, x, y - p.height)
    return p.height


def render_badge_pdf(visit) -> bytes:
    """Diseño corregido y alineado, sin superposiciones"""
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(BADGE_WIDTH, BADGE_HEIGHT))

    # ==== HEADER ====
    c.setFillColorRGB(0.12, 0.47, 0.86)
    c.rect(0, BADGE_HEIGHT - HEADER_H, BADGE_WIDTH, HEADER_H, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN + 5 * mm, BADGE_HEIGHT - HEADER_H + 4 * mm, "SisVisitas — Gafete")

    c.setStrokeColor(colors.black)
    c.rect(MARGIN, MARGIN, BADGE_WIDTH - 2 * MARGIN, BADGE_HEIGHT - 2 * MARGIN)

    # ==== DATOS ====
    citizen = visit.case.citizen
    topic = getattr(visit.case, "topic", None)
    badge_code = (visit.badge_code or "SIN-COD").strip()
    full_name = (citizen.name or "—").strip()
    unit = (visit.target_unit or "—").strip()
    tema_text = f"{topic.code} — {topic.name}" if topic else "—"
    dt = visit.checkin_at or datetime.now()

    # ==== NOMBRE ====
    c.setFont("Helvetica-Bold", 12)
    name_y = BADGE_HEIGHT - HEADER_H - 6 * mm
    name_max_width = BADGE_WIDTH - 20 * mm

    while c.stringWidth(full_name, "Helvetica-Bold", 12) > name_max_width:
        c.setFont("Helvetica-Bold", 11)
        if c.stringWidth(full_name, "Helvetica-Bold", 11) <= name_max_width:
            break
        c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(BADGE_WIDTH / 2, name_y, full_name)

    # ==== FILA CENTRAL ====
    row_top = name_y - 4 * mm
    row_bottom = FOOTER_H + 12 * mm
    row_height = row_top - row_bottom

    photo_x = MARGIN + 5 * mm
    data_x = photo_x + PHOTO_W + GUTTER
    qr_x = BADGE_WIDTH - MARGIN - QR_SIZE - 5 * mm

    photo_y = row_bottom + (row_height - PHOTO_H) / 2
    qr_y = row_bottom + (row_height - QR_SIZE) / 2
    text_y = photo_y + PHOTO_H

    # === FOTO ===
    photo_rel = (getattr(visit, "photo_path", "") or "").strip()
    photo_abs = os.path.join(settings.MEDIA_ROOT, photo_rel) if photo_rel else ""
    img = _img_reader(photo_abs)
    if img:
        c.drawImage(img, photo_x, photo_y, width=PHOTO_W, height=PHOTO_H, preserveAspectRatio=True, mask="auto")
    else:
        c.setStrokeColor(colors.gray)
        c.rect(photo_x, photo_y, PHOTO_W, PHOTO_H)
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(photo_x + PHOTO_W / 2, photo_y + PHOTO_H / 2, "Sin foto")
        c.setStrokeColor(colors.black)

    # === QR ===
    base_url = getattr(settings, "SITE_URL", "") or "https://tuservidor.com"
    qr_url = f"{base_url}/visitas/verificar/{quote(badge_code)}"
    qr_code = qr.QrCodeWidget(qr_url)
    bounds = qr_code.getBounds()
    w, h = bounds[2] - bounds[0], bounds[3] - bounds[1]
    d = Drawing(QR_SIZE, QR_SIZE, transform=[QR_SIZE / w, 0, 0, QR_SIZE / h, 0, 0])
    d.add(qr_code)
    renderPDF.draw(d, c, qr_x, qr_y)

    # === TEXTO (ahora con wrapping y espacio real) ===
    text_width = qr_x - data_x - 3 * mm
    label = _p_style(size=8, color=colors.HexColor("#5f6b7a"))
    value = _p_style(size=9, bold=True, color=colors.black)

    y = text_y
    y -= _draw_paragraph(c, "Unidad destino:", data_x, y, text_width, label) + 1
    y -= _draw_paragraph(c, unit, data_x, y, text_width, value) + 3
    y -= _draw_paragraph(c, "Tema:", data_x, y, text_width, label) + 1
    y -= _draw_paragraph(c, tema_text, data_x, y, text_width, _p_style(size=9)) + 2

    # ==== FOOTER ====
    c.setFillColorRGB(0.96, 0.97, 0.99)
    c.rect(MARGIN, MARGIN, BADGE_WIDTH - 2 * MARGIN, FOOTER_H, stroke=0, fill=1)
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN + 5 * mm, MARGIN + FOOTER_H - 4 * mm, f"Entrada: {dt.strftime('%Y-%m-%d %H:%M')}")
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(BADGE_WIDTH / 2, MARGIN + 2 * mm, f"Código visitante: {badge_code}")

    c.showPage()
    c.save()
    pdf = buf.getvalue()
    buf.close()
    return pdf
