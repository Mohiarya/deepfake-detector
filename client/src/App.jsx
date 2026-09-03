import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import UploadZone from "./components/UploadZone";
import HowItWorks from "./components/HowItWorks";
import AboutSection from "./components/AboutSection";
import AnalyzingView from "./components/AnalyzingView";
import ResultView from "./components/ResultView";
import NoFaceState from "./components/NoFaceState";
import ErrorView from "./components/ErrorView";
import { API_BASE } from "./api";
import { PIPELINE_STEPS } from "./pipelineSteps";

// The real backend does detection + preprocessing + inference as one atomic
// request — there's no live progress signal from the server. So the pipeline
// steps advance on a timer purely for visual feedback, but STOP at the last
// processing step and wait there (pulsing) until the real response actually
// comes back, rather than a fixed animation that could finish before or long
// after the real work does.
const STEP_DELAY_MS = 550;
const LAST_AUTO_ADVANCE_STEP = PIPELINE_STEPS.length - 2;

function getStoredTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function App() {
  // idle | analyzing | result | no-face | error
  const [stage, setStage] = useState("idle");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [errorKind, setErrorKind] = useState("request_failed");
  const [errorDetail, setErrorDetail] = useState("");
  const [theme, setTheme] = useState(() => getStoredTheme() || "system");

  const timersRef = useRef([]);
  const howItWorksRef = useRef(null);
  const aboutRef = useRef(null);
  const analyzeRef = useRef(null);

  useEffect(() => {
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const isDark =
        prev === "dark" ||
        (prev === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      const next = isDark ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore — storage unavailable */
      }
      return next;
    });
  }

  function handleNavigate(target) {
    if (target === "how-it-works") howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
    else if (target === "about") aboutRef.current?.scrollIntoView({ behavior: "smooth" });
    else analyzeRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function clearPendingTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function handleFileSelected(file) {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemove() {
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    clearPendingTimers();
    setResult(null);
    setStage("analyzing");
    setStepIndex(0);

    for (let i = 1; i <= LAST_AUTO_ADVANCE_STEP; i++) {
      const timer = setTimeout(() => setStepIndex(i), i * STEP_DELAY_MS);
      timersRef.current.push(timer);
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    let res;
    try {
      res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: formData });
    } catch {
      clearPendingTimers();
      setErrorKind("backend_unavailable");
      setErrorDetail("");
      setStage("error");
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      clearPendingTimers();
      setErrorKind("unexpected_response");
      setErrorDetail(`Server responded with status ${res.status} but no valid JSON body.`);
      setStage("error");
      return;
    }

    if (!res.ok) {
      clearPendingTimers();
      const detail = typeof data?.detail === "string" ? data.detail : "";
      if (detail.toLowerCase().includes("must be an image")) {
        setErrorKind("unsupported_file");
      } else if (detail.toLowerCase().includes("decode")) {
        setErrorKind("invalid_image");
      } else {
        setErrorKind("request_failed");
      }
      setErrorDetail(detail || `Request failed (${res.status})`);
      setStage("error");
      return;
    }

    if (typeof data?.facesDetected !== "number" || !Array.isArray(data?.results)) {
      clearPendingTimers();
      setErrorKind("unexpected_response");
      setErrorDetail("The response was missing expected fields.");
      setStage("error");
      return;
    }

    clearPendingTimers();
    setStepIndex(PIPELINE_STEPS.length - 1);
    setResult(data);
    setStage(data.facesDetected === 0 ? "no-face" : "result");
  }

  function reset() {
    clearPendingTimers();
    setStage("idle");
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorDetail("");
  }

  const effectiveTheme =
    theme === "system"
      ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <div className="app">
      <Header onNavigate={handleNavigate} theme={effectiveTheme} onToggleTheme={toggleTheme} />

      <main className="app-main" ref={analyzeRef}>
        {stage === "idle" && (
          <>
            <Hero />
            <UploadZone
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              onFileSelected={handleFileSelected}
              onRemove={handleRemove}
              onSubmit={handleSubmit}
            />
          </>
        )}

        {stage === "analyzing" && (
          <AnalyzingView previewUrl={previewUrl} currentStepIndex={stepIndex} />
        )}

        {stage === "result" && result && (
          <ResultView previewUrl={previewUrl} result={result} onReset={reset} />
        )}

        {stage === "no-face" && <NoFaceState onReset={reset} />}

        {stage === "error" && (
          <ErrorView kind={errorKind} detail={errorDetail} onReset={reset} />
        )}
      </main>

      <HowItWorks ref={howItWorksRef} />
      <AboutSection ref={aboutRef} />

      <footer className="site-footer">
        <p>Deepfake Forensics Lab — a portfolio project. Not a certified forensic tool.</p>
      </footer>
    </div>
  );
}

export default App;
