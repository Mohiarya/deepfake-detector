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

BoundingBox = tuple[int, int, int, int]  # (x, y, width, height)


def detect_faces(image: np.ndarray) -> list[BoundingBox]:
    """
    Detects faces in a BGR image (as loaded by cv2.imread).
    Returns one (x, y, w, h) bounding box per detected face.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    boxes = _face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,   # how much the search window shrinks at each scale step
        minNeighbors=5,    # how many overlapping detections are required to
                           # confirm a face (higher = fewer false positives)
        minSize=(30, 30),  # ignore detections smaller than 30x30 px
    )
    return [tuple(int(v) for v in box) for box in boxes]


def crop_faces(image: np.ndarray, boxes: list[BoundingBox]) -> list[np.ndarray]:
    """
    Given the original image and boxes from detect_faces, returns the
    cropped face regions as separate image arrays.
    """
    return [image[y : y + h, x : x + w] for (x, y, w, h) in boxes]
