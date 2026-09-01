// Shared between AnalysisPipeline.jsx and App.jsx's (currently simulated)
// analysis flow, so the displayed steps and the state machine driving them
// can't drift out of sync.
export const PIPELINE_STEPS = [
  { key: "loaded", label: "Image loaded" },
  { key: "detected", label: "Face detected" },
  { key: "cropped", label: "Face cropped" },
  { key: "inference", label: "MesoNet inference" },
  { key: "result", label: "Result compiled" },
];
