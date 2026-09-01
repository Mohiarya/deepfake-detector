"""
FastAPI backend — wraps face_detector.py and mesonet.py exactly as they
already are (no changes to either module's behavior). This file's only
job is: receive an uploaded image over HTTP, call the existing pipeline,
return the results as JSON.
"""

import os
from contextlib import asynccontextmanager

import numpy as np
import cv2
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from face_detector import crop_faces, detect_faces
from mesonet import load_model, predict_real_probability

# Loaded once at startup, not per-request — this is the same model object
# from mesonet.load_model(), used unmodified. Stored on app.state (not a
# module-level global) so it's explicitly tied to this app instance's
# lifecycle, which is what makes it work correctly under TestClient too.
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model()
    yield


app = FastAPI(title="Deepfake Detector API", lifespan=lifespan)

_allowed_origins = ["http://localhost:5190", "http://localhost:5173"]
if os.environ.get("CLIENT_ORIGIN"):
    _allowed_origins.append(os.environ["CLIENT_ORIGIN"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# UI-presentation thresholds only — separate from, and unrelated to, the
# 0.5 classification threshold fixed for the Phase 3 evaluation. Changing
# these does not affect the model, its accuracy, or the reported 62.4%.
def _label_for_score(score: float) -> str:
    if score >= 0.7:
        return "likely real"
    if score <= 0.3:
        return "likely manipulated"
    return "uncertain"


@app.post("/api/analyze")
async def analyze(request: Request, file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    image_array = np.frombuffer(contents, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image file")

    boxes = detect_faces(image)
    crops = crop_faces(image, boxes)

    results = []
    model = request.app.state.model
    for (x, y, w, h), face_crop in zip(boxes, crops):
        score = predict_real_probability(model, face_crop)
        results.append(
            {
                "box": {"x": x, "y": y, "w": w, "h": h},
                "realProbability": round(score, 4),
                "label": _label_for_score(score),
            }
        )

    return {"facesDetected": len(boxes), "results": results}
