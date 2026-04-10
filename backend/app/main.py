"""
DataTalk Backend — FastAPI Application Entry Point
Handles CORS, session management, and route mounting.
"""
import os
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Import routes
from app.routes import upload, chat, semantic, export

# In-memory session store (metadata only — actual data is in .duckdb files)
sessions = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    os.makedirs("sessions", exist_ok=True)  # Ensure sessions dir exists on startup
    print("🚀 DataTalk Backend starting...")
    yield
    # Cleanup: close all DuckDB connections and delete session .duckdb files
    for sid in list(sessions.keys()):
        if "db" in sessions[sid]:
            try:
                sessions[sid]["db"].close()
                sessions[sid]["db"].delete_file()  # Remove .duckdb file from disk
            except Exception:
                pass
    sessions.clear()
    print("🛑 DataTalk Backend stopped.")


app = FastAPI(
    title="DataTalk API",
    description="AI-powered data analysis backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(upload.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(semantic.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "sessions": len(sessions)}


# Make sessions accessible to routes via app.state
app.state.sessions = sessions
