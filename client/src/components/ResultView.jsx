import { useState } from "react";
import AnalysisDetails from "./AnalysisDetails";
import TechnicalDetailsPanel from "./TechnicalDetailsPanel";

function toneFor(label) {
  if (label === "likely real") return "real";
  if (label === "likely manipulated") return "fake";
  return "uncertain";
}

function verdictText(label) {
  if (label === "likely real") return "Likely Real";
  if (label === "likely manipulated") return "Likely Manipulated";
  return "Uncertain";
}

function FaceBox({ box, naturalWidth, naturalHeight, tone, index, isSelected, onSelect }) {
  if (!naturalWidth || !naturalHeight) return null;
  const style = {
    left: `${(box.x / naturalWidth) * 100}%`,
    top: `${(box.y / naturalHeight) * 100}%`,
    width: `${(box.w / naturalWidth) * 100}%`,
    height: `${(box.h / naturalHeight) * 100}%`,
  };
  return (
    <div
      className={`face-box face-box-${tone} ${isSelected ? "face-box-selected" : ""}`}
      style={style}
      onClick={() => onSelect(index)}
      role="button"
      tabIndex={0}
      aria-label={`Face ${index + 1}`}
    >
      <span className="face-box-tag mono">FACE {String(index + 1).padStart(2, "0")}</span>
    </div>
  );
}

export default function ResultView({ previewUrl, result, onReset }) {
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const faces = result.results;
  const selected = faces[selectedIndex] || faces[0];
  const tone = toneFor(selected.label);
  const manipulatedProbability = 1 - selected.realProbability;

  return (
    <div className="fade-in">
      <div className="result-toolbar">
        <h2>Analysis Result</h2>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>
          Analyze another
        </button>
      </div>

      <div className="result-layout">
        {/* LEFT: image viewer with clickable bounding boxes */}
        <div className="image-viewer">
          <div className="image-viewer-wrap">
            <img
              src={previewUrl}
              alt="Analyzed"
              onLoad={(e) =>
                setNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight })
              }
            />
            {faces.map((face, i) => (
              <FaceBox
                key={i}
                box={face.box}
                naturalWidth={naturalSize.w}
                naturalHeight={naturalSize.h}
                tone={toneFor(face.label)}
                index={i}
                isSelected={i === selectedIndex}
                onSelect={setSelectedIndex}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: authenticity signal + details */}
        <div className="result-panel">
          <div className="panel-card">
            <p className="panel-label">Authenticity Signal</p>

            <div className="verdict-row">
              <span className={`verdict-badge verdict-${tone}`}>{verdictText(selected.label)}</span>
              {faces.length > 1 && (
                <span className="face-index-tag mono">FACE {String(selectedIndex + 1).padStart(2, "0")}</span>
              )}
            </div>

            <div className="meter-track">
              <div
                className={`meter-fill meter-fill-${tone}`}
                style={{ width: `${selected.realProbability * 100}%` }}
              />
            </div>
            <div className="meter-labels">
              <span>Manipulated</span>
              <span>Real</span>
            </div>

            <div className="meter-numbers">
              <div className="meter-number">
                <div className="meter-number-value mono">
                  {(selected.realProbability * 100).toFixed(1)}%
                </div>
                <div className="meter-number-label">Real probability</div>
              </div>
              <div className="meter-number">
                <div className="meter-number-value mono">
                  {(manipulatedProbability * 100).toFixed(1)}%
                </div>
                <div className="meter-number-label">Manipulation probability</div>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <p className="panel-label">Summary</p>
            <div className="tech-grid">
              <div>
                <div className="tech-item-label mono">Faces Detected</div>
                <div className="tech-item-value">{result.facesDetected}</div>
              </div>
              <div>
                <div className="tech-item-label mono">Model Used</div>
                <div className="tech-item-value">MesoNet</div>
              </div>
              <div>
                <div className="tech-item-label mono">Analysis Status</div>
                <div className="tech-item-value">Complete</div>
              </div>
            </div>
          </div>

          {faces.length > 1 && (
            <div className="panel-card">
              <p className="panel-label">Detected Faces ({faces.length})</p>
              <div className="face-list">
                {faces.map((face, i) => {
                  const t = toneFor(face.label);
                  return (
                    <div
                      key={i}
                      className={`face-list-item ${i === selectedIndex ? "face-list-item-selected" : ""}`}
                      onClick={() => setSelectedIndex(i)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="face-list-left">
                        <span className={`face-list-swatch ${t}`} />
                        <span className="face-list-label">
                          Face {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="face-list-score mono">
                        {(face.realProbability * 100).toFixed(0)}% real
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <TechnicalDetailsPanel />
          <AnalysisDetails />

          <div className="panel-card">
            <p className="limitations-note">
              <strong>AI estimate — not a certainty.</strong> This score
              reflects one model's confidence, not a verified fact.
              Independent evaluation against a labeled dataset found this
              model correctly identifies only ~40% of actual manipulated
              faces, while rarely mislabeling real ones. Treat this as one
              signal among several, not a final verdict.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
