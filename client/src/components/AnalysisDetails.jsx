import { useState } from "react";
import { PIPELINE_STEPS } from "../pipelineSteps";

export default function AnalysisDetails() {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel-card">
      <button className="expandable-toggle" onClick={() => setOpen((o) => !o)}>
        <span>How was this image analyzed?</span>
        <span className={`expandable-chevron ${open ? "expandable-chevron-open" : ""}`} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="expandable-content">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.key} className="pipeline-explain-step">
              <span className="pipeline-explain-num">{step.number}</span>
              <div className="pipeline-explain-text">
                <strong>{step.title}</strong>
                <span>{step.explain}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
