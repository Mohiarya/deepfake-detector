export default function NoFaceState({ onReset }) {
  return (
    <div className="empty-state-card fade-in">
      <div className="empty-state-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 10h.01M15 10h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8.5 15.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <h3>No face detected</h3>
      <p>
        MesoNet analysis requires a detectable face in the image. Try a
        clearer, front-facing photo where a face is fully visible.
      </p>
      <button className="btn btn-primary" onClick={onReset}>
        Analyze another image
      </button>
    </div>
  );
}
