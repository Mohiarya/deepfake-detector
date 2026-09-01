"""
Face detection and cropping using OpenCV's Haar Cascade classifier.

Kept deliberately separate from any deepfake-classification logic (which
comes in Phase 2) — this module's only job is "find faces in an image and
crop them out." That separation is what lets video frame-sampling be added
later (Phase 2 / v2) without touching this file: a video pipeline just calls
detect_faces()/crop_faces() once per extracted frame.
"""

import cv2
import numpy as np

# Haar Cascade is a classical (pre-deep-learning) face detector: it scans
# the image at multiple scales looking for patterns of light/dark regions
# that resemble a face (eyes are darker than cheeks, the nose bridge is
# lighter than its sides, etc.). It's fast and needs no GPU, but it's known
# to struggle with rotated, angled, or partially-occluded faces — a real,
# documented limitation, tested explicitly below rather than glossed over.
_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Second-stage verification: a real, confirmed failure mode of the frontal-
# face cascade alone is firing on repetitive textured surfaces (e.g. a
# patterned fabric print) whose light/dark contrast blobs coincidentally
# resemble face-like Haar features at a given scale — found via a genuine
# production report (a photo where 4 of 5 "faces" detected were actually a
# floral print on clothing). Requiring at least one detectable eye inside a
# candidate face region is a standard, well-established two-stage
# verification technique: a textured surface has no eye-like features for
# this second, more specific cascade to find, while an actual face
# (including small/harder ones) reliably does.
_eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")

BoundingBox = tuple[int, int, int, int]  # (x, y, width, height)


def _looks_like_a_face(gray_crop: np.ndarray) -> bool:
    """True if at least one eye is detected inside this candidate region."""
    eyes = _eye_cascade.detectMultiScale(gray_crop, scaleFactor=1.1, minNeighbors=3)
    return len(eyes) >= 1


def detect_faces(image: np.ndarray) -> list[BoundingBox]:
    """
    Detects faces in a BGR image (as loaded by cv2.imread).
    Returns one (x, y, w, h) bounding box per detected face — candidates
    from the frontal-face cascade are kept only if eye-verification (see
    _looks_like_a_face) confirms they actually contain a face, filtering
    out false positives on textured/patterned non-face regions.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    candidates = _face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,   # how much the search window shrinks at each scale step
        minNeighbors=5,    # how many overlapping detections are required to
                           # confirm a face (higher = fewer false positives)
        minSize=(30, 30),  # ignore detections smaller than 30x30 px
    )

    verified = []
    for x, y, w, h in candidates:
        face_region = gray[y : y + h, x : x + w]
        if _looks_like_a_face(face_region):
            verified.append((int(x), int(y), int(w), int(h)))
    return verified


def crop_faces(image: np.ndarray, boxes: list[BoundingBox]) -> list[np.ndarray]:
    """
    Given the original image and boxes from detect_faces, returns the
    cropped face regions as separate image arrays.
    """
    return [image[y : y + h, x : x + w] for (x, y, w, h) in boxes]
