# Deepfake Forensics Lab

An AI-assisted image forensics tool: upload a photo, and it detects faces and scores each one for signs of manipulation using a MesoNet deepfake classifier.

**This is not a definitive deepfake detector.** It produces a probabilistic authenticity *signal* from one compact model, evaluated at 62.4% accuracy on an independent test set (details below) — not a verified fact, and not proof that any image is real or fake.

## Live Demo

- **Frontend:** https://deepfake-forensics-lab.vercel.app
- **Backend API:** https://deepfake-detector-api-oo5i.onrender.com

The backend is hosted on Render's free tier and may take up to a minute to wake up after inactivity.

## Features

- Drag-and-drop image upload with preview, replace, and remove
- Server-side face detection with bounding-box overlays on the original image
- Multi-face support — each detected face gets its own score, selectable independently, with the bounding boxes and result panel kept in sync
- MesoNet-based real/manipulated/uncertain classification with a probability meter
- Distinct error states for invalid images, unsupported files, an unreachable backend, and unexpected responses — no silent failures
- A dedicated empty state when no face is detected
- An expandable breakdown of each pipeline stage, and a technical-details panel listing only real, verifiable facts about the stack
- Light and dark themes (auto by system preference, with a manual toggle)
- Fully responsive layout, tested from desktop down to mobile

## How It Works

```
Uploaded image
      │
      ▼
OpenCV Haar Cascade face detection
(a second eye-detection pass filters out false positives,
 e.g. on patterned clothing or backgrounds)
      │
      ▼
Each detected face is cropped, converted to RGB,
resized to 256×256, and normalized to [0, 1]
      │
      ▼
MesoNet (Meso4) scores each crop for
mesoscopic manipulation artifacts
      │
      ▼
Real/manipulated probability per face,
returned to the frontend and rendered as
an authenticity signal — not a certainty
```

All analysis happens server-side, per request. Nothing is stored: there is no scan history or database on the backend.

## Tech Stack

**Frontend**
- React 19 + Vite
- Plain CSS with a design-token system (light/dark themes, no CSS framework)

**Backend**
- Python + FastAPI
- OpenCV (Haar Cascade face detection)
- TensorFlow/Keras (MesoNet / Meso4 classifier)
- scikit-learn (evaluation script only — not part of the running API)

**Infra**
- Vercel (frontend hosting)
- Render (backend hosting)
- Git/GitHub

## Model / Evaluation

The model was evaluated independently against a held-out test set, separate from the model authors' own reference samples. Full methodology, including sampling and domain-match checks, is documented in [`server/PHASE3_EVALUATION.md`](server/PHASE3_EVALUATION.md).

- **Dataset:** [`nanduncs/1000-videos-split`](https://www.kaggle.com/datasets/nanduncs/1000-videos-split) (Kaggle), `test/` split only — sourced from FaceForensics++
- **178 evaluated frames** (89 real, 89 fake) sampled from **60 unique videos** (2–3 frames per video)
- Fixed 0.5 classification threshold, decided before running, never tuned afterward
- **Accuracy: 62.4%**

| Metric | Real class | Fake class |
|---|---|---|
| Precision | 0.581 | 0.735 |
| Recall | **0.852** | **0.400** |
| F1 | 0.691 | 0.518 |

The model is much better at not flagging real faces as fake (85.2% real recall) than at catching actual manipulated faces (40.0% fake recall — it misses more than half). **62.4% accuracy should not be read as evidence this model reliably detects deepfakes** — it's closer to a 60-independent-trial estimate than a 178-trial one, since frames from the same video are correlated, not independent observations.

## Limitations

- Analyzes still images only — no video or temporal analysis
- MesoNet (2018) is a compact, older research architecture, not a state-of-the-art detector
- Sensitive to preprocessing/compression differences between training and input data
- Evaluated on one dataset, one manipulation method (FaceForensics++ "Deepfakes"), at a modest sample size — this is not a comprehensive benchmark
- False positives and false negatives are both expected and observed in evaluation
- The output is an authenticity *signal* to inform judgment, not forensic proof

## Local Development

**Backend**
```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

By default the frontend calls `http://localhost:8000/api`. To point it at a different backend, set `VITE_API_BASE_URL` (see `client/.env.production` for the production example).

## Testing

Backend: `cd server && pytest` — **13/13 tests passing**, covering face detection, MesoNet inference, and the full API pipeline.

The frontend has been manually verified end-to-end against the real (non-mocked) backend for:
- Single-face and multi-face images, including bounding-box alignment and face-selection sync between the image and the result panel
- No-face images
- Corrupted/invalid image files
- Unsupported (non-image) file uploads
- An unreachable backend
- Light and dark themes
- Responsive layout from ~375px mobile up through desktop

## Project Structure

```
deepfake-detector/
├── client/                       React + Vite frontend
│   ├── src/
│   │   ├── components/           UploadZone, ResultView, ErrorView, etc.
│   │   ├── App.jsx               Orchestrates state, theme, and the real API call
│   │   ├── api.js                API base URL
│   │   ├── index.css             Design tokens + all component styles
│   │   └── pipelineSteps.js      Shared source of truth for the pipeline explainer
│   └── vite.config.js
├── server/                       FastAPI backend
│   ├── main.py                   API entrypoint (/api/analyze, /api/health)
│   ├── face_detector.py          OpenCV Haar Cascade + eye-verification
│   ├── mesonet.py                MesoNet (Meso4) loading + inference
│   ├── evaluate.py               Independent accuracy evaluation script
│   ├── mesonet_weights/          Pretrained Meso4_DF weights
│   ├── tests/                    pytest suite + fixtures
│   └── PHASE3_EVALUATION.md      Full evaluation methodology and results
└── render.yaml                   Render deployment config
```

## Future Improvements

These are ideas, not implemented functionality:
- Video/frame-sequence analysis instead of single images
- Temporal aggregation across frames of the same source
- A stronger, more robust face detector than Haar Cascade
- Evaluation against a larger, more diverse, multi-method dataset
- A more modern classifier architecture than MesoNet
- Systematic robustness testing across compression levels and image sources
