"""
GET  /api/compliance/documents — list loaded compliance docs
POST /api/compliance/query     — direct compliance question (no data agent)
"""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
import os
import pypdf
from pydantic import BaseModel

router = APIRouter()


class ComplianceQueryRequest(BaseModel):
    question: str
    session_id: str | None = None


@router.get("/compliance/documents")
async def list_compliance_documents(request: Request):
    from app.core.compliance_kb import get_compliance_kb
    kb = get_compliance_kb()
    if not kb.is_loaded:
        return {"documents": [], "loaded": False}
    return {"documents": kb.list_documents(), "loaded": True, "total_chunks": len(kb.chunks)}


@router.post("/compliance/query")
async def compliance_query(request: Request, body: ComplianceQueryRequest):
    from app.agents.compliance_agent import answer_compliance_question
    try:
        result = await answer_compliance_question(body.question, schema=None)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance query failed: {str(e)}")


@router.post("/compliance/upload")
async def upload_compliance_document(request: Request, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        reader = pypdf.PdfReader(file.file)
        text = "\n".join(page.extract_text() for page in reader.pages if page.extract_text())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {str(e)}")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the PDF")

    from app.utils.gemini_client import gemini
    prompt = f"""You are a compliance expert. Extract the core compliance guidelines from the following text.
Format your response EXACTLY as this JSON structure:
{{
  "id": "{os.path.splitext(file.filename)[0][:10].lower().replace(' ', '_')}",
  "icon": "FileText",
  "title": "Document Title",
  "subtitle": "Brief Subtitle",
  "color": "#3b82f6",
  "rules": [
    {{"label": "Rule 1 Name", "text": "Rule 1 description"}},
    {{"label": "Rule 2 Name", "text": "Rule 2 description"}}
  ]
}}
Choose a suitable Hex color for the 'color' field (e.g. #22c55e, #f59e0b). Keep rules concise.
Document Text:
{text[:20000]}
"""
    try:
        guideline_json = await gemini.generate_json(prompt=prompt, temperature=0.1)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
        
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "compliance_docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    base_name = os.path.splitext(file.filename)[0]
    md_path = os.path.join(docs_dir, f"{base_name}.md")
    
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# {guideline_json.get('title', base_name)}\n\n")
        f.write(text)
        
    from app.core.compliance_kb import get_compliance_kb
    kb = get_compliance_kb()
    kb.load_documents(docs_dir)
    
    return guideline_json
