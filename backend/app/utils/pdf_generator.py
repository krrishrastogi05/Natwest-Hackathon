"""
PDF report generator using ReportLab.
Creates a professional Q&A session report with schema, answers, confidence, and sources.
"""
import io
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


def sanitize_text(text: str) -> str:
    """Remove non-ASCII characters and problematic symbols for ReportLab."""
    if not text:
        return ""
    # Remove non-printable characters
    text = re.sub(r"[^\x20-\x7E\n\t]", "", str(text))
    # Escape HTML special chars for ReportLab paragraph rendering
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Truncate very long text
    if len(text) > 500:
        text = text[:500] + "... [See full answer in app]"
    return text


def generate_pdf_report(
    messages: list[dict],
    filename: str,
    schema: list[dict],
    semantic_layer=None,
) -> bytes:
    """Generate a full PDF report and return as bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=HexColor("#3b82f6"),
        spaceAfter=12,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=HexColor("#94a3b8"),
        spaceAfter=20,
    )
    question_style = ParagraphStyle(
        "Question",
        parent=styles["Normal"],
        fontSize=11,
        textColor=HexColor("#3b82f6"),
        fontName="Helvetica-Bold",
        spaceBefore=16,
        spaceAfter=4,
    )
    answer_style = ParagraphStyle(
        "Answer",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor("#1f2937"),
        spaceBefore=4,
        spaceAfter=8,
        leftIndent=12,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=8,
        textColor=HexColor("#6b7280"),
        spaceBefore=2,
        spaceAfter=12,
        leftIndent=12,
    )

    story = []

    # ── Title ──────────────────────────────────────────────────────────────
    story.append(Paragraph("DataTalk Analysis Report", title_style))
    story.append(Paragraph(f"Dataset: {sanitize_text(filename)}", subtitle_style))

    # ── Schema table ────────────────────────────────────────────────────────
    if schema:
        story.append(Paragraph("Dataset Schema", styles["Heading2"]))
        table_data = [["Column", "Type", "Missing %"]]
        for col in schema[:20]:  # Limit to 20 columns
            table_data.append([
                sanitize_text(col["name"]),
                col["type"],
                f"{col['missing_pct']}%",
            ])

        t = Table(table_data, colWidths=[200, 100, 80])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#3b82f6")),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e5e7eb")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#f9fafb"), HexColor("#ffffff")]),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

    # ── Q&A pairs ───────────────────────────────────────────────────────────
    if messages:
        story.append(Paragraph("Question &amp; Answer Session", styles["Heading2"]))

        for msg in messages:
            role = msg.get("role", "")
            content = sanitize_text(msg.get("content", ""))

            if role == "user":
                story.append(Paragraph(f"Q: {content}", question_style))
            elif role == "assistant":
                story.append(Paragraph(f"A: {content}", answer_style))

                # Confidence info
                conf = msg.get("confidence")
                if conf:
                    story.append(Paragraph(
                        f"Confidence: {conf.get('score', 'N/A')}% ({conf.get('level', 'N/A')})",
                        meta_style,
                    ))

                # Sources
                sources = msg.get("sources", [])
                if sources:
                    parsed_sources = []
                    for s in sources:
                        if isinstance(s, dict):
                            parsed_sources.append(s.get("title") or s.get("name") or s.get("value") or s.get("url") or "Web Source")
                        elif isinstance(s, str):
                            parsed_sources.append(s)
                            
                    source_text = ", ".join(parsed_sources)
                    story.append(Paragraph(
                        f"Sources: {sanitize_text(source_text)}", meta_style
                    ))

                # SQL query
                sql = msg.get("sql_query")
                if sql:
                    story.append(Paragraph(f"SQL: {sanitize_text(sql)}", meta_style))

    # ── Footer ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "Generated by DataTalk | NatWest Code for Purpose Hackathon",
        ParagraphStyle(
            "Footer",
            parent=styles["Normal"],
            fontSize=8,
            textColor=HexColor("#94a3b8"),
            alignment=TA_CENTER,
        ),
    ))

    doc.build(story)
    return buffer.getvalue()
