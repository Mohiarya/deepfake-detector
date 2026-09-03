import { PIPELINE_STEPS } from "../pipelineSteps";

/**
 * currentStepIndex: index into PIPELINE_STEPS currently active.
 * Steps before it are "done", the active one pulses, later ones are pending.
 * This is a visual-feedback device — the real backend does detection +
 * preprocessing + inference as one atomic request with no progress
 * events, so the UI advances on a timer up to the last processing step
 * and then WAITS there for the real response (see App.jsx) rather than
 * pretending to know backend-internal progress.
 */
export default function AnalyzingView({ previewUrl, currentStepIndex }) {
  return (
    <div className="analyzing-layout fade-in">
      {previewUrl && (
        <div className="scan-frame">
          <img src={previewUrl} alt="Analyzing" />
          <div className="scan-line" />
        </div>
      )}

      <span className="status-pill mono">
        {PIPELINE_STEPS[currentStepIndex]?.short.toUpperCase() || "PROCESSING"}
      </span>

      <div className="pipeline">
        <ol className="pipeline-steps">
          {PIPELINE_STEPS.map((step, i) => {
            const state =
              i < currentStepIndex ? "done" : i === currentStepIndex ? "active" : "pending";
            return (
              <li key={step.key} className={`pipeline-step pipeline-step-${state}`}>
                <span className="pipeline-marker">
                  {state === "done" ? (
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5L6.5 12L13 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="pipeline-dot" />
                  )}
                </span>
                <span>
                  <span className="mono" style={{ fontSize: "11px", opacity: 0.6, marginRight: 8 }}>
                    {step.number}
                  </span>
                  {step.title}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
