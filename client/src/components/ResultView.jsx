import { useState } from "react";

function labelClass(label) {
  if (label === "likely real") return "real";
  if (label === "likely manipulated") return "fake";
  return "uncertain";
}

function FaceBox({ box, naturalWidth, naturalHeight, tone }) {
  if (!naturalWidth || !naturalHeight) return null;
  const style = {
    left: `${(box.x / naturalWidth) * 100}%`,
    top: `${(box.y / naturalHeight) * 100}%`,
    width: `${(box.w / naturalWidth) * 100}%`,
    height: `${(box.h / naturalHeight) * 100}%`,
  };
  return <div className={`face-box face-box-${tone}`} style={style} />;
}

function ProbabilityMeter({ score, tone }) {
  return (
    <div className="meter">
      <div className="meter-track">
        <div className={`meter-fill meter-fill-${tone}`} style={{ width: `${score * 100}%` }} />
        <div className="meter-midline" />
      </div>
      <div className="meter-scale">
        <span>manipulated</span>
        <span>real</span>
      </div>
    </div>
  );
}

export default function ResultView({ previewUrl, result, onReset }) {
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [howOpen, setHowOpen] = useState(false);

  const faces = result.results;

  return (
    <div className="result-view">
      <div className="result-image-frame corner-frame">
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />

        <div className="result-image-wrap">
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
              tone={labelClass(face.label)}
            />
          ))}
        </div>
      </div>

      <div className="result-panel">
        <div className="result-panel-header">
          <span className="faces-count">
            {result.facesDetected} face{result.facesDetected === 1 ? "" : "s"} detected
          </span>
          <button className="reset-link" onClick={onReset}>
            Analyze another
          </button>
        </div>

        {faces.length === 0 && (
          <p className="empty-note">
            No face was detected in this image — try a clearer, front-facing photo.
          </p>
        )}

        {faces.map((face, i) => {
          const tone = labelClass(face.label);
          return (
            <div key={i} className={`face-result-card face-result-${tone}`}>
              <div className="face-result-top">
                <span className="face-index">Face {i + 1}</span>
                <span className={`face-verdict face-verdict-${tone}`}>{face.label}</span>
              </div>
              <ProbabilityMeter score={face.realProbability} tone={tone} />
              <span className="face-score">{(face.realProbability * 100).toFixed(1)}% real</span>
            </div>
          );
        })}

        <div className="limitations">
          <strong>AI estimate — not a certainty.</strong> This score reflects one
          model's confidence, not a verified fact. Independent evaluation against
          a labeled dataset found this model correctly identifies only ~40% of
          actual manipulated faces, while rarely mislabeling real ones. Treat this
          as one signal among several, not a final verdict.
        </div>

        <div className="how-section">
          <button className="how-toggle" onClick={() => setHowOpen((o) => !o)}>
            <span>How was this analyzed?</span>
            <span className={`how-chevron ${howOpen ? "how-chevron-open" : ""}`}>⌄</span>
          </button>
          {howOpen && (
            <div className="how-content">
              <p>
                <strong>1. Face detection</strong> — OpenCV's Haar Cascade
                classifier scans the image for face-shaped patterns and returns
                a bounding box for each one found.
              </p>
              <p>
                <strong>2. Preprocessing</strong> — each detected face is cropped,
                converted to RGB, resized to 256×256, and normalized to the
                [0,1] pixel range the model expects.
              </p>
              <p>
                <strong>3. MesoNet inference</strong> — a compact CNN
                (Meso4, trained on FaceForensics++) scores the crop for
                mesoscopic manipulation artifacts, producing a single
                real/fake probability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
