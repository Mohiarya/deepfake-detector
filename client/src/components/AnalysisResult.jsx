function labelClass(label) {
  if (label === "likely real") return "label-real";
  if (label === "likely manipulated") return "label-fake";
  return "label-uncertain";
}

export default function AnalysisResult({ status, result, error }) {
  if (status === "loading") {
    return <p className="status-text">Analyzing...</p>;
  }

  if (status === "error") {
    return <p className="status-text error-text">{error}</p>;
  }

  if (status !== "done" || !result) {
    return null;
  }

  if (result.facesDetected === 0) {
    return (
      <p className="status-text">
        No face detected in this image. Try a clearer photo with a visible face.
      </p>
    );
  }

  return (
    <div className="results">
      <p className="status-text">
        {result.facesDetected} face{result.facesDetected > 1 ? "s" : ""} detected
      </p>

      <ul className="face-results">
        {result.results.map((face, i) => (
          <li key={i} className={`face-result ${labelClass(face.label)}`}>
            <strong>Face {i + 1}:</strong> {(face.realProbability * 100).toFixed(1)}% real
            <span className="face-label"> — {face.label}</span>
          </li>
        ))}
      </ul>

      <p className="limitations-note">
        <strong>This is not a certainty.</strong> This tool flags likely signs of
        manipulation with a confidence score, not a definitive verdict. In our own
        evaluation against an independent, labeled dataset, this model correctly
        identified only about 40% of actual manipulated faces (it's much better at
        confirming real images than catching fakes). Never rely on this alone —
        verify suspicious media through multiple independent sources.
      </p>
    </div>
  );
}
