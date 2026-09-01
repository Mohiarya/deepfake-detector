"""
Smoke tests for mesonet.py — confirms the model loads, runs inference
without crashing, and scores go in the expected direction on a handful of
the ORIGINAL AUTHORS' OWN labeled sample images (2 real, 2 deepfake, from
their repo's test_images/ folder).

This is explicitly NOT an accuracy evaluation. Four images is not a
meaningful sample size, and these came from the model's own reference
repo, not an independent test set — reporting a percentage from this would
be exactly the kind of fabricated/assumed number we're avoiding. Real
accuracy numbers come later, from Phase 3, against a proper independent
labeled dataset.
"""

from pathlib import Path

import cv2
import pytest

from mesonet import load_model, predict_real_probability

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "mesonet_smoke_test"


@pytest.fixture(scope="module")
def model():
    return load_model()


def _scores_for(model, subfolder: str) -> list[float]:
    paths = sorted((FIXTURES_DIR / subfolder).glob("*.jpg"))
    assert paths, f"No sample images found in {subfolder} — did the copy step run?"
    images = [cv2.imread(str(p)) for p in paths]
    return [predict_real_probability(model, img) for img in images]


def test_model_loads_and_produces_scores_in_valid_range(model):
    scores = _scores_for(model, "real") + _scores_for(model, "df")
    assert len(scores) == 4
    for score in scores:
        assert 0.0 <= score <= 1.0


def test_real_images_score_higher_than_fake_images_on_average(model):
    """
    Directional sanity check only: confirms the "higher score = more real"
    label convention (inferred from Keras's alphabetical class ordering,
    "df" < "real") actually holds, rather than trusting that reasoning
    blindly. This is checking the model isn't wired backwards — it is
    NOT an accuracy claim.
    """
    real_scores = _scores_for(model, "real")
    fake_scores = _scores_for(model, "df")

    avg_real = sum(real_scores) / len(real_scores)
    avg_fake = sum(fake_scores) / len(fake_scores)

    print(f"\nreal scores: {real_scores}")
    print(f"df (fake) scores: {fake_scores}")

    assert avg_real > avg_fake, (
        "Real images scored lower than fake images on average — the "
        "real/fake label direction is inverted from what we assumed."
    )
