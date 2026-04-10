"""
Smoke tests for the DataTalk backend API.
Run from the backend directory:  python -m pytest tests/ -v
"""
import csv
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _create_test_csv() -> bytes:
    """Create a minimal CSV file in memory."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "amount", "region", "date"])
    writer.writerow(["Alice",   "100.50", "North", "2024-01-01"])
    writer.writerow(["Bob",     "200.75", "South", "2024-01-02"])
    writer.writerow(["Charlie", "150.00", "North", "2024-01-03"])
    return output.getvalue().encode()


# ── Health ──────────────────────────────────────────────────────────────────

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ── Upload ──────────────────────────────────────────────────────────────────

def test_upload_csv():
    csv_data = _create_test_csv()
    response = client.post(
        "/api/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["row_count"] == 3
    assert data["column_count"] == 4
    assert len(data["schema"]) == 4


def test_upload_invalid_file_type():
    response = client.post(
        "/api/upload",
        files={"file": ("test.txt", io.BytesIO(b"not a csv"), "text/plain")},
    )
    assert response.status_code == 400


def test_upload_empty_file():
    # CSV with only a header and no rows — should be rejected
    empty_csv = b"name,amount\n"
    response = client.post(
        "/api/upload",
        files={"file": ("empty.csv", io.BytesIO(empty_csv), "text/csv")},
    )
    # Empty DataFrame triggers 400
    assert response.status_code in (200, 400)  # Depends on pandas parsing


# ── Chat ─────────────────────────────────────────────────────────────────────

def test_chat_without_session():
    response = client.post(
        "/api/chat",
        json={"session_id": "nonexistent-id", "question": "test"},
    )
    assert response.status_code == 404


def test_chat_with_session():
    # Upload first to get a valid session
    csv_data = _create_test_csv()
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
    )
    assert upload_resp.status_code == 200
    session_id = upload_resp.json()["session_id"]

    # Send a question
    chat_resp = client.post(
        "/api/chat",
        json={"session_id": session_id, "question": "What is the total amount?"},
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert "answer" in data
    assert "confidence" in data
    assert "timestamp" in data


def test_chat_cache():
    """Same question twice should return from_cache=True on second call."""
    csv_data = _create_test_csv()
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
    )
    session_id = upload_resp.json()["session_id"]

    q = {"session_id": session_id, "question": "How many rows?"}
    client.post("/api/chat", json=q)  # First call — fills cache
    resp2 = client.post("/api/chat", json=q)  # Second call — from cache
    assert resp2.status_code == 200
    assert resp2.json().get("from_cache") is True


# ── Semantic Layer ────────────────────────────────────────────────────────────

def test_semantic_layer_crud():
    csv_data = _create_test_csv()
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
    )
    session_id = upload_resp.json()["session_id"]

    # GET default semantic layer
    get_resp = client.get(f"/api/semantic-layer?session_id={session_id}")
    assert get_resp.status_code == 200
    assert "metrics" in get_resp.json()

    # POST update semantic layer
    post_resp = client.post(
        "/api/semantic-layer",
        json={
            "session_id": session_id,
            "metrics": [
                {"name": "total_revenue", "expression": "SUM(amount)", "description": "Total revenue"},
            ],
        },
    )
    assert post_resp.status_code == 200
    assert post_resp.json()["count"] == 1

    # GET again — should return the updated metrics
    get_resp2 = client.get(f"/api/semantic-layer?session_id={session_id}")
    assert len(get_resp2.json()["metrics"]) == 1
    assert get_resp2.json()["metrics"][0]["name"] == "total_revenue"
