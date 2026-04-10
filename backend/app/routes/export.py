"""
POST /api/export-pdf — Generate and stream a PDF report of the Q&A session.
"""
import io
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class ExportRequest(BaseModel):
    session_id: str
    messages: list[dict]


@router.post("/export-pdf")
async def export_pdf(request: Request, body: ExportRequest):
    """Generate a PDF report of the Q&A session and return as a download."""
    sessions = request.app.state.sessions
    if body.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    try:
        from app.utils.pdf_generator import generate_pdf_report

        session = sessions[body.session_id]
        pdf_bytes = generate_pdf_report(
            messages=body.messages,
            filename=session.get("filename", "Unknown"),
            schema=session.get("schema", []),
            semantic_layer=session.get("semantic_layer"),
        )

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=DataTalk_Report.pdf"
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"PDF generation failed: {str(e)}"
        )
