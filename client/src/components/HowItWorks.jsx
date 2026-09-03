import { forwardRef } from "react";
import { PIPELINE_STEPS } from "../pipelineSteps";

const HowItWorks = forwardRef(function HowItWorks(_props, ref) {
  return (
    <section id="how-it-works" ref={ref} className="section">
      <div className="section-header">
        <p className="section-label">Pipeline</p>
        <h2>How it works</h2>
        <p>Every uploaded image passes through four real processing stages.</p>
      </div>

      <div className="step-grid">
        {PIPELINE_STEPS.map((step) => (
          <div key={step.key} className="step-card">
            <div className="step-number mono">{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.short}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default HowItWorks;
