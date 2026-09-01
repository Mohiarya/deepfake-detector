"""
Tests for main.py — the FastAPI layer. Uses the same Phase 1 fixtures as
test_face_detector.py, verifying the API wraps the existing pipeline
correctly rather than re-testing face_detector.py or mesonet.py's own
logic (already covered in their own test files).
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from main import app

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="module")
def client():
    # Using TestClient as a context manager is what actually triggers the
    # app's lifespan startup (which loads the model) — without `with`, the
    # model never loads and every request fails.
    with TestClient(app) as c:
        yield c


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_single_face_image(client):
    with open(FIXTURES_DIR / "single_face.jpg", "rb") as f:
        response = client.post("/api/analyze", files={"file": ("single_face.jpg", f, "image/jpeg")})

    assert response.status_code == 200
    data = response.json()
    assert data["facesDetected"] == 1
    assert len(data["results"]) == 1

    result = data["results"][0]
    assert 0.0 <= result["realProbability"] <= 1.0
    assert result["label"] in ("likely real", "likely manipulated", "uncertain")
    assert set(result["box"].keys()) == {"x", "y", "w", "h"}


def test_analyze_no_face_image(client):
    with open(FIXTURES_DIR / "no_face.jpg", "rb") as f:
        response = client.post("/api/analyze", files={"file": ("no_face.jpg", f, "image/jpeg")})

    assert response.status_code == 200
    data = response.json()
    assert data["facesDetected"] == 0
    assert data["results"] == []


def test_analyze_rejects_non_image_file(client):
    response = client.post(
        "/api/analyze", files={"file": ("not_an_image.txt", b"hello world", "text/plain")}
    )
    assert response.status_code == 400
