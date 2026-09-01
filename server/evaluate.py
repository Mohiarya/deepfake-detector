"""
Phase 3: evaluation of MesoNet (Meso4_DF) against an independent, labeled,
domain-matched dataset.

Dataset: nanduncs/1000-videos-split (Kaggle, Apache 2.0) — pre-extracted,
pre-aligned face frames derived from FaceForensics++/Celeb-DF, real vs.
"Deepfakes"-method fake. This is domain-matched to what Meso4_DF was
trained on (see mesonet.py's docstring) — a genuine in-domain evaluation,
not the cross-domain-generalization case we discussed as a real
possibility going in.

We use ONLY the dataset's own test/ split — never train/ or validation/ —
so we're not touching whatever data may have informed this dataset's own
curation choices any more than necessary.

SCOPE: this measures MesoNet's classification accuracy on already-cropped,
aligned faces. It does NOT measure the full pipeline (face detection +
classification) — face detection was evaluated separately, on its own
terms, in test_face_detector.py.

Methodology, decided BEFORE running this and not changed afterward:
- Frames are grouped by source video ID first (frames from the same video
  are highly correlated/near-duplicate), then sampled at the video level,
  a limited number of frames per video — so results reflect many distinct
  videos, not a few videos' frames repeated many times.
- A small DEBUG set (from videos never used in the reported evaluation) is
  used only to confirm this script runs correctly. It is not reported.
- Classification threshold is fixed at 0.5 here, before running.
- This script is run once. Whatever it outputs is what gets reported —
  no re-running with different parameters to chase a better number.
"""

import random
from collections import defaultdict
from pathlib import Path

import cv2
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from mesonet import load_model, predict_real_probability

DATA_DIR = Path(__file__).parent / "data" / "1000_videos" / "test"
RANDOM_SEED = 42
DEBUG_VIDEOS_PER_CLASS = 2
EVAL_VIDEOS_PER_CLASS = 30
MAX_FRAMES_PER_VIDEO = 3
THRESHOLD = 0.5


def group_by_video(folder: Path) -> dict[str, list[Path]]:
    """Groups frame image paths by their source video ID (the filename
    with the trailing _<framenumber> stripped)."""
    groups = defaultdict(list)
    for path in folder.glob("*.png"):
        video_id = path.stem.rsplit("_", 1)[0]
        groups[video_id].append(path)
    return groups


def split_debug_and_eval_videos(video_ids: list[str], rng: random.Random):
    """One seeded shuffle, then disjoint slices — guarantees debug and
    eval videos never overlap, by construction rather than by convention."""
    shuffled = sorted(video_ids)  # sort first so the shuffle is deterministic given the seed
    rng.shuffle(shuffled)
    debug_ids = shuffled[:DEBUG_VIDEOS_PER_CLASS]
    eval_ids = shuffled[DEBUG_VIDEOS_PER_CLASS : DEBUG_VIDEOS_PER_CLASS + EVAL_VIDEOS_PER_CLASS]
    return debug_ids, eval_ids


def frames_for_videos(video_groups: dict, video_ids: list[str], rng: random.Random) -> list[Path]:
    frames = []
    for vid in video_ids:
        vid_frames = sorted(video_groups[vid])
        rng.shuffle(vid_frames)
        frames.extend(vid_frames[:MAX_FRAMES_PER_VIDEO])
    return frames


def build_sets():
    rng = random.Random(RANDOM_SEED)

    real_groups = group_by_video(DATA_DIR / "real")
    fake_groups = group_by_video(DATA_DIR / "fake")

    debug_real_ids, eval_real_ids = split_debug_and_eval_videos(list(real_groups.keys()), rng)
    debug_fake_ids, eval_fake_ids = split_debug_and_eval_videos(list(fake_groups.keys()), rng)

    debug_set = (
        [(p, 1) for p in frames_for_videos(real_groups, debug_real_ids, rng)]
        + [(p, 0) for p in frames_for_videos(fake_groups, debug_fake_ids, rng)]
    )
    eval_set = (
        [(p, 1) for p in frames_for_videos(real_groups, eval_real_ids, rng)]
        + [(p, 0) for p in frames_for_videos(fake_groups, eval_fake_ids, rng)]
    )
    return debug_set, eval_set


def run_inference(model, image_label_pairs: list[tuple[Path, int]]):
    y_true, y_pred, scores = [], [], []
    for path, true_label in image_label_pairs:
        image = cv2.imread(str(path))
        score = predict_real_probability(model, image)
        predicted_label = 1 if score >= THRESHOLD else 0
        y_true.append(true_label)
        y_pred.append(predicted_label)
        scores.append(score)
    return y_true, y_pred, scores


def print_report(y_true, y_pred):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    print("\nConfusion matrix (rows=actual, cols=predicted; 0=fake, 1=real):")
    print(f"                 predicted fake   predicted real")
    print(f"  actual fake         {tn:>4}             {fp:>4}")
    print(f"  actual real         {fn:>4}             {tp:>4}")

    print(f"\nn = {len(y_true)}")
    print(f"Accuracy:  {accuracy_score(y_true, y_pred):.3f}")
    print(f"Precision (real): {precision_score(y_true, y_pred):.3f}")
    print(f"Recall (real):    {recall_score(y_true, y_pred):.3f}")
    print(f"F1 (real):        {f1_score(y_true, y_pred):.3f}")
    print(f"Precision (fake): {precision_score(y_true, y_pred, pos_label=0):.3f}")
    print(f"Recall (fake):    {recall_score(y_true, y_pred, pos_label=0):.3f}")
    print(f"F1 (fake):        {f1_score(y_true, y_pred, pos_label=0):.3f}")


def main():
    debug_set, eval_set = build_sets()
    model = load_model()

    print(f"Debug set: {len(debug_set)} images (never reported)")
    print(f"Evaluation set: {len(eval_set)} images")

    print("\n--- Running debug set (sanity check only) ---")
    debug_true, debug_pred, _ = run_inference(model, debug_set)
    print(f"Debug set predictions: {debug_pred}")
    print(f"Debug set actual:      {debug_true}")

    print("\n--- Running evaluation set (this is what gets reported) ---")
    eval_true, eval_pred, eval_scores = run_inference(model, eval_set)
    print_report(eval_true, eval_pred)


if __name__ == "__main__":
    main()
