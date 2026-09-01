import { useRef, useState } from "react";
import UploadZone from "./components/UploadZone";
import AnalysisPipeline from "./components/AnalysisPipeline";
import ResultView from "./components/ResultView";
import { API_BASE } from "./api";
import { PIPELINE_STEPS } from "./pipelineSteps";

// The real backend does detection + inference as one atomic request — there's
// no live progress signal from the server. So the pipeline steps advance on
// a timer purely for feedback, but STOP at the last processing step
// ("MesoNet inference") and wait there (pulsing) until the real response
// actually comes back, rather than a fixed animation that could finish
// before or long after the real work does.
const STEP_DELAY_MS = 550;
const LAST_AUTO_ADVANCE_STEP = PIPELINE_STEPS.length - 2; // hold here until response
const RESULT_STEP = PIPELINE_STEPS.length - 1;

function App() {
  const [stage, setStage] = useState("idle"); // idle | analyzing | result | error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const timersRef = useRef([]);

  function clearPendingTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  async function handleFileSelected(file) {
    clearPendingTimers();
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setErrorMessage("");
    setStage("analyzing");
    setStepIndex(0);

    // Advance through the visual steps up to (and holding at) the last
    // processing step — never past it until the real response is in hand.
    for (let i = 1; i <= LAST_AUTO_ADVANCE_STEP; i++) {
      const timer = setTimeout(() => setStepIndex(i), i * STEP_DELAY_MS);
      timersRef.current.push(timer);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || `Request failed (${res.status})`);
      }

      clearPendingTimers();
      setStepIndex(RESULT_STEP);
      setResult(data);
      setStage("result");
    } catch (err) {
      clearPendingTimers();
      setErrorMessage(
        err.message === "Failed to fetch"
          ? "Couldn't reach the server — is the backend running?"
          : err.message
      );
      setStage("error");
    }
  }

  function reset() {
    clearPendingTimers();
    setStage("idle");
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage("");
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

        {stage === "error" && (
          <div className="error-view corner-frame">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            <p className="error-title">Analysis failed</p>
            <p className="error-message">{errorMessage}</p>
            <button className="reset-link" onClick={reset}>
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
