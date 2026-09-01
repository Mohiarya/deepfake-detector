"""
Tests for face_detector.py, run against real fixture images (see
generate_fixtures.py) rather than mocked data — face detection is exactly
the kind of thing that looks fine in isolation but silently breaks on real
images, so these tests use real (if synthetically composited) photos.
"""

from pathlib import Path

import cv2
import pytest

from face_detector import crop_faces, detect_faces

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def load_fixture(name: str):
    image = cv2.imread(str(FIXTURES_DIR / name))
    assert image is not None, f"Fixture {name} failed to load — did you run generate_fixtures.py?"
    return image


def test_detects_exactly_one_face_in_single_face_image():
    image = load_fixture("single_face.jpg")
    boxes = detect_faces(image)
    assert len(boxes) == 1


def test_detects_no_faces_in_image_with_no_face():
    image = load_fixture("no_face.jpg")
    boxes = detect_faces(image)
    assert len(boxes) == 0


def test_detects_exactly_two_faces_in_multi_face_image():
    """
    This used to be a known-limitation test: the frontal-face cascade alone
    returned 3 boxes here, not 2 — the smaller (resized) face got detected
    twice by two adjacent, non-overlapping windows. Eye-verification (added
    after a real production false-positive report — see the module
    docstring) resolves this as a side effect: the spurious duplicate box
    has no detectable eyes and gets filtered out, while the genuine small
    face keeps its 2 eyes and survives. Same fix, unrelated bug, no longer
    a documented limitation — an actual improvement, not just tracking.
    """
    image = load_fixture("multi_face.jpg")
    boxes = detect_faces(image)
    assert len(boxes) == 2


def test_cropped_face_has_expected_dimensions():
    image = load_fixture("single_face.jpg")
    boxes = detect_faces(image)
    crops = crop_faces(image, boxes)

    assert len(crops) == 1
    crop = crops[0]
    x, y, w, h = boxes[0]
    assert crop.shape[0] == h
    assert crop.shape[1] == w
    # The crop should be a real, non-empty image, not a degenerate 0-size one.
    assert crop.size > 0


def test_real_world_patterned_clothing_does_not_produce_false_positive_faces():
    """
    Regression test for a real production bug: a genuine photo (one real
    face, patterned fabric clothing) was reported as "5 faces detected" —
    4 of them were false positives on the clothing's floral print, which
    the frontal-face cascade alone matched at a certain scale. Eye-
    verification (see face_detector.py) fixed this.

    The source photo is personal/identifiable, so it's kept local and
    gitignored rather than committed to this public repo — this test
    skips gracefully (not fails) if the file isn't present, e.g. in CI or
    on another machine.
    """
    fixture_path = FIXTURES_DIR / "investigation" / "mohi_photo.jpg"
    if not fixture_path.exists():
        pytest.skip("Local-only fixture not present (kept out of the public repo)")

    image = cv2.imread(str(fixture_path))
    boxes = detect_faces(image)
    assert len(boxes) == 1, (
        f"Expected exactly 1 real face, got {len(boxes)} — false positives "
        "on the clothing pattern may have regressed."
    )


def test_known_limitation_rotated_face_is_often_missed():
    """
    Documents a real, known weakness of Haar Cascade frontal-face detection:
    it's trained on upright, front-facing faces and is unreliable on
    significantly rotated ones. This test isn't asserting "correct"
    behavior — it's recording the actual current behavior on a 90-degree
    rotated face, so the limitation is explicit and tracked rather than
    silently discovered later (e.g. by a user uploading a sideways photo).
    """
    image = load_fixture("rotated_face.jpg")
    boxes = detect_faces(image)
    # As of writing, the frontal-face cascade detects 0 faces on a 90-degree
    # rotation. If this ever starts passing with len(boxes) >= 1, that's a
    # good thing — update this test to reflect the improved behavior.
    assert len(boxes) == 0, (
        "If this fails because a face WAS detected, that's an improvement, "
        "not a bug — update this test's expectation."
    )
