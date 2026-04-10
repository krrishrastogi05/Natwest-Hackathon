"""
POST /api/chat — Main chat endpoint.
Receives a question, routes to Person C's agents, returns structured response.
Falls back to mock response if agents aren't ready yet.
"""
import hashlib
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    question: str
    options: dict = {}


@router.post("/chat")
async def chat(request: Request, body: ChatRequest):
    """Process a user question through the agent pipeline."""
    sessions = request.app.state.sessions

    # Validate session
    if body.session_id not in sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a file first.",
        )

    session = sessions[body.session_id]

    # Check Q&A cache (avoid duplicate LLM calls)
    cache_key = hashlib.md5(body.question.lower().strip().encode()).hexdigest()
    if cache_key in session.get("cache", {}):
        cached = session["cache"][cache_key].copy()
        cached["from_cache"] = True
        return cached

    try:
        # Import Person C's orchestrator (will exist once Person C builds it)
        from app.agents.orchestrator import process_question

        result = await process_question(
            question=body.question,
            session=session,
            options=body.options,
        )

    except ImportError:
        # Person C's agents not ready yet — return mock response for frontend testing
        result = _mock_response(body.question)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing question: {str(e)}",
        )

    # Add timestamp
    result["timestamp"] = datetime.utcnow().isoformat() + "Z"
    result["from_cache"] = False

    # Cache the result (max CACHE_SIZE entries)
    cache = session.setdefault("cache", {})
    if len(cache) < 20:
        cache[cache_key] = result

    # Store in message history
    session.setdefault("messages", []).append({
        "role": "user",
        "content": body.question,
        "timestamp": result["timestamp"],
    })
    session["messages"].append({
        "role": "assistant",
        **result,
    })

    return result


def _mock_response(question: str) -> dict:
    """
    Mock response for testing before Person C's agents are built.
    Remove this once the orchestrator is connected.
    """
    return {
        "answer": (
            f"[MOCK] I received your question: '{question}'. "
            "The AI agents are not yet connected. This is a placeholder response."
        ),
        "agent_used": "mock",
        "sql_query": None,
        "python_code": None,
        "chart": None,
        "matplotlib_image": None,
        "confidence": {
            "score": 50,
            "level": "Medium",
            "breakdown": {
                "row_coverage": 50,
                "data_completeness": 50,
                "schema_match": 50,
                "web_corroboration": 50,
            },
        },
        "sources": [],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "from_cache": False,
    }
