"""
Integration smoke test: confirms face_detector.py's output can feed
directly into mesonet.py's input — the two modules stay independent (no
imports between them), this test is what actually wires them together,
same as the real inference endpoint will later.

Still not an accuracy claim — this fixture is a real, unmanipulated photo,
so we only assert the pipeline runs end-to-end and produces a valid score,
not that the score is "correct" in any evaluative sense.
"""

from pathlib import Path

import cv2

from face_detector import crop_faces, detect_faces
from mesonet import load_model, predict_real_probability

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_face_detector_output_feeds_directly_into_mesonet():
    image = cv2.imread(str(FIXTURES_DIR / "single_face.jpg"))
    boxes = detect_faces(image)
    assert len(boxes) == 1

    face_crop = crop_faces(image, boxes)[0]

    model = load_model()
    score = predict_real_probability(model, face_crop)

    assert 0.0 <= score <= 1.0
    print(f"\nEnd-to-end score on single_face.jpg (a real, unmanipulated photo): {score}")
