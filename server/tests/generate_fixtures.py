"""
One-time script that generates the test fixture images used by
test_face_detector.py. Run once (`python tests/generate_fixtures.py`) and
the resulting files are committed to the repo — tests don't regenerate them
on every run, so they're fast and don't depend on scikit-image at test time.

Source images come from scikit-image's bundled sample data (permissively
licensed, ships with the package — no network download involved).
"""

import cv2
import numpy as np
from pathlib import Path
from skimage import data

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def to_bgr(rgb_image: np.ndarray) -> np.ndarray:
    """skimage images are RGB; OpenCV expects BGR."""
    return cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)


def main():
    FIXTURES_DIR.mkdir(exist_ok=True)

    # 1. A single, clear, front-facing face (real photo).
    astronaut = to_bgr(data.astronaut())
    cv2.imwrite(str(FIXTURES_DIR / "single_face.jpg"), astronaut)

    # 2. No face at all — a cat (real photo, guaranteed zero faces).
    cat = to_bgr(data.chelsea())
    cv2.imwrite(str(FIXTURES_DIR / "no_face.jpg"), cat)

    # 3. Multiple faces — composite of two copies of the same real face at
    # different positions/scales on one canvas.
    h, w = astronaut.shape[:2]
    canvas = np.full((h, w * 2, 3), 255, dtype=np.uint8)
    canvas[:, :w] = astronaut
    small_face = cv2.resize(astronaut, (w // 2, h // 2))
    sh, sw = small_face.shape[:2]
    canvas[h - sh :, w + (w - sw) // 2 : w + (w - sw) // 2 + sw] = small_face
    cv2.imwrite(str(FIXTURES_DIR / "multi_face.jpg"), canvas)

    # 4. A rotated face — Haar Cascade's frontal-face model is known to be
    # weak on rotated/angled faces. This fixture exists to document that
    # limitation with a real test, not to pretend it doesn't exist.
    center = (w // 2, h // 2)
    rot_matrix = cv2.getRotationMatrix2D(center, 90, 1.0)
    rotated = cv2.warpAffine(astronaut, rot_matrix, (w, h))
    cv2.imwrite(str(FIXTURES_DIR / "rotated_face.jpg"), rotated)

    print(f"Wrote 4 fixture images to {FIXTURES_DIR}")


if __name__ == "__main__":
    main()
