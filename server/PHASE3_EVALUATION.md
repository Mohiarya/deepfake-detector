# Phase 3: MesoNet (Meso4_DF) evaluation

This documents the methodology and results of evaluating the pretrained
`Meso4_DF` model against an independent labeled dataset — not the model's
own reference samples (that was Phase 2's smoke test, see `test_mesonet.py`).

**Result stands as obtained. No tuning, threshold adjustment, or re-running
was performed after seeing it.**

## Dataset

[`nanduncs/1000-videos-split`](https://www.kaggle.com/datasets/nanduncs/1000-videos-split)
(Kaggle, Apache 2.0). Its own metadata cites two sources: the official
[FaceForensics++ repo](https://github.com/ondyari/FaceForensics) and the
official [Celeb-DF repo](https://github.com/yuezunli/celeb-deepfakeforensics)
— a combined dataset, pre-extracted into cropped, aligned 128x128 face
frames, split by the uploader into `train/`, `validation/`, and `test/`.

We use **only `test/`**, never `train/` or `validation/`.

## What "real" and "fake" mean here

- `real/<videoID>_<frame>.png` — frames from an authentic, unmanipulated
  source video.
- `fake/<sourceID>_<targetID>_<frame>.png` — frames from a face-swap
  ("Deepfakes" method) video, where `sourceID`'s face was swapped onto
  `targetID`'s video.

## Domain-match investigation

`Meso4_DF` was trained specifically on FaceForensics++'s "Deepfakes"
manipulation method. Since this dataset combines FF++ *and* Celeb-DF (a
newer, more sophisticated method), there was a real risk our evaluation set
silently mixed both — which would make any resulting number hard to
interpret cleanly.

**Checked directly, not assumed:** `test/` contains zero Celeb-DF-style
filenames (Celeb-DF uses an `idN_...` naming convention; all 253 Celeb-DF
videos in this dataset landed in `train/`, none in `test/`). `test/` is
100% FaceForensics++ — a genuine in-domain evaluation.

## Split-integrity check

The uploader's own `train/validation/test` split has a small boundary flaw:
one video ID overlaps between `train` and `test` (real: `"129"`), and one
between `validation` and `test` (real: `"067"`) — same pattern for one fake
pair each. This is a real, if narrow (~1-2 videos out of ~62-63 per split),
issue with the *source* dataset's own split, but is **irrelevant to this
evaluation**: `Meso4_DF` is a frozen model, pretrained in 2018 by a
different team on their own separate data. It was never trained on any
part of this 2023 Kaggle repackaging, so overlap between *this dataset's*
train and test splits cannot leak into our result.

## Sampling methodology

- Frames are grouped by source video ID first (frames from the same video
  are highly correlated), then sampling happens at the **video** level:
  30 real + 30 fake videos, seed `42`, up to 3 frames per video.
- A separate debug set (2 real + 2 fake videos, disjoint from the eval
  videos by construction — one seeded shuffle, sliced) was used only to
  confirm the script runs correctly. Never included in reported numbers.
- Classification threshold (0.5) was fixed before running, not tuned
  afterward.
- Script was run exactly once. This is that run's output.

### Effective sample size caveat

The reported n=178 images represent only **60 independent videos** (2-3
correlated frames each — confirmed by direct inspection of the actual
sampled set). This doesn't bias the point estimate, but the real
statistical confidence behind 62.4% is closer to a 60-trial estimate than
a 178-trial one — worth stating alongside the number, not treating n=178
at face value.

## Scope

This evaluates `Meso4_DF`'s **classification** accuracy on already-cropped,
aligned faces. It does not evaluate the full pipeline (face detection +
classification) — face detection was evaluated separately, on its own
terms, in `test_face_detector.py`.

## Results (n=178: 89 real, 89 fake, from 60 unique videos)

```
                 predicted fake   predicted real
  actual fake           36               54
  actual real           13               75
```

| Metric | Real class | Fake class |
|---|---|---|
| Precision | 0.581 | 0.735 |
| Recall | 0.852 | 0.400 |
| F1 | 0.691 | 0.518 |

**Accuracy: 0.624**

## Interpretation

The model is substantially better at not flagging real images as fake
(85% recall on real) than at catching actual fakes (40% recall on fake —
misses more than half). A plausible but **unverified** explanation: this
Kaggle repackaging's face-cropping/alignment convention may differ from
what the original authors used to train and validate `Meso4_DF` — CNNs
trained on a specific crop margin are known to be sensitive to that. This
was not investigated further per the decision to accept this baseline
as-is rather than chase a better number.
