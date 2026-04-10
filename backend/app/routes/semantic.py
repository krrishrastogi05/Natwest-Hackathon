"""
GET/POST /api/semantic-layer — Semantic layer CRUD endpoints.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter()


class SemanticLayerRequest(BaseModel):
    session_id: str
    metrics: list[dict]


@router.get("/semantic-layer")
async def get_semantic_layer(request: Request, session_id: str):
    """Get current semantic layer metric definitions for a session."""
    sessions = request.app.state.sessions
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[session_id]
    semantic = session.get("semantic_layer")
    if not semantic:
        return {"metrics": []}

    return {"metrics": semantic.get_metrics()}


@router.post("/semantic-layer")
async def update_semantic_layer(request: Request, body: SemanticLayerRequest):
    """Update (replace) semantic layer metric definitions for a session."""
    sessions = request.app.state.sessions
    if body.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[body.session_id]
    semantic = session.get("semantic_layer")
    if not semantic:
        from app.core.semantic_layer import SemanticLayerManager
        semantic = SemanticLayerManager()
        session["semantic_layer"] = semantic

    semantic.set_metrics(body.metrics)

    return {"status": "ok", "count": len(body.metrics)}
