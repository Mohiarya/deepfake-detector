import { useState } from "react";
import UploadZone from "./components/UploadZone";
import AnalysisPipeline from "./components/AnalysisPipeline";
import ResultView from "./components/ResultView";
import { PIPELINE_STEPS } from "./pipelineSteps";

// TEMPORARY, structure-only placeholder — shaped EXACTLY like the real
// POST /api/analyze response (see server/main.py) so swapping this out
// for a real fetch call is a drop-in change, not a rewrite. Removed in
// the next step, once we wire the actual API.
const MOCK_RESULT = {
  facesDetected: 1,
  results: [{ box: { x: 177, y: 66, w: 94, h: 94 }, realProbability: 0.7021, label: "likely real" }],
};

// Also temporary: the real backend does detection + inference as one
// atomic request, so this timed step-by-step animation is a UX device,
// not a literal readout of backend progress. Whether to keep it exactly
// like this (fixed-duration animation) or tie it to real request timing
// is a decision for when we wire the API — flagging that now rather than
// pretending this is final.
const STEP_DELAY_MS = 550;

function App() {
  const [stage, setStage] = useState("idle"); // idle | analyzing | result
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);

  function handleFileSelected(file) {
    setPreviewUrl(URL.createObjectURL(file));
    setStage("analyzing");
    setStepIndex(0);

    PIPELINE_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStepIndex(i);
        if (i === PIPELINE_STEPS.length - 1) {
          setTimeout(() => {
            setResult(MOCK_RESULT);
            setStage("result");
          }, STEP_DELAY_MS);
        }
      }, i * STEP_DELAY_MS);
    });
  }

  function reset() {
    setStage("idle");
    setPreviewUrl(null);
    setResult(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="lab-tag">AI FORENSIC ANALYSIS</span>
        <h1>Deepfake Detector</h1>
        <p className="app-subtitle">
          Upload a photo to check for signs of AI-generated face manipulation.
        </p>
      </header>

      <main className="app-main">
        {stage === "idle" && <UploadZone onFileSelected={handleFileSelected} />}

        {stage === "analyzing" && (
          <div className="analyzing-view">
            {previewUrl && (
              <div className="analyzing-image-frame corner-frame">
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
                <img src={previewUrl} alt="Uploading" />
                <div className="scan-line" />
              </div>
            )}
            <AnalysisPipeline currentStepIndex={stepIndex} />
          </div>
        )}

        {stage === "result" && result && (
          <ResultView previewUrl={previewUrl} result={result} onReset={reset} />
        )}
      </main>
    </div>
  );
}

export default App;
