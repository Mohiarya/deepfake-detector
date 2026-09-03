// Single source of truth for the 4-stage pipeline, used by:
// HowItWorks (landing page), AnalyzingView (progress list), and
// AnalysisDetails (result screen's expandable explanation).
// Keeping one definition means the marketing copy and the technical
// explanation can never silently drift apart.
export const PIPELINE_STEPS = [
  {
    key: "detection",
    number: "01",
    title: "Face Detection",
    short: "Locating faces in the image",
    explain:
      "OpenCV's Haar Cascade classifier scans the image for face-shaped patterns. A second eye-detection pass verifies each candidate, filtering out false positives on textured surfaces like patterned fabric.",
  },
  {
    key: "preprocessing",
    number: "02",
    title: "Face Preprocessing",
    short: "Cropping and normalizing each face",
    explain:
      "Each detected face is cropped, converted to RGB, resized to 256×256, and normalized to the [0,1] pixel range the model expects.",
  },
  {
    key: "mesonet",
    number: "03",
    title: "MesoNet Analysis",
    short: "Scoring for manipulation artifacts",
    explain:
      "A compact CNN (Meso4, trained on FaceForensics++) scores each face crop for mesoscopic manipulation artifacts, producing a single real/fake probability per face.",
  },
  {
    key: "signal",
    number: "04",
    title: "Authenticity Signal",
    short: "Producing a probability estimate",
    explain:
      "The model's raw output is a probability, not a certainty. It's presented here as a confidence signal — independently evaluated at 62.4% accuracy against a labeled dataset, not assumed.",
  },
];
