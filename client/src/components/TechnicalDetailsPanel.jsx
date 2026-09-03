// Deliberately only real, verifiable facts about this project's actual
// stack — no invented confidence scores, processing speed, or hardware
// info, per the explicit instruction not to fabricate technical claims.
const TECH_FACTS = [
  { label: "Model", value: "MesoNet (Meso4)" },
  { label: "Face Detector", value: "OpenCV Haar Cascade" },
  { label: "API", value: "FastAPI" },
  { label: "Input", value: "Image (JPG / PNG / WEBP)" },
];

export default function TechnicalDetailsPanel() {
  return (
    <div className="panel-card">
      <p className="panel-label">Technical details</p>
      <div className="tech-grid">
        {TECH_FACTS.map((item) => (
          <div key={item.label}>
            <div className="tech-item-label mono">{item.label}</div>
            <div className="tech-item-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
