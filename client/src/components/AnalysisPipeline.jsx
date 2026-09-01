import { PIPELINE_STEPS } from "../pipelineSteps";

/**
 * currentStepIndex: index into PIPELINE_STEPS of the step currently in
 * progress. Steps before it are "done", steps after are "pending".
 */
export default function AnalysisPipeline({ currentStepIndex }) {
  return (
    <div className="pipeline">
      <p className="pipeline-heading">Analyzing</p>
      <ol className="pipeline-steps">
        {PIPELINE_STEPS.map((step, i) => {
          const state =
            i < currentStepIndex ? "done" : i === currentStepIndex ? "active" : "pending";
          return (
            <li key={step.key} className={`pipeline-step pipeline-step-${state}`}>
              <span className="pipeline-marker">
                {state === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
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
              <span className="pipeline-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
