const ERROR_COPY = {
  unsupported_file: {
    title: "Unsupported file type",
    message: "This file isn't a supported image format. Upload a JPG, PNG, or WEBP file.",
  },
  invalid_image: {
    title: "Couldn't read this image",
    message: "The file looks corrupted or isn't a valid image, so it couldn't be decoded.",
  },
  backend_unavailable: {
    title: "Can't reach the server",
    message: "The analysis backend didn't respond. It may be offline or starting up — check that it's running and try again.",
  },
  request_failed: {
    title: "Analysis failed",
    message: "The server encountered an error while analyzing this image.",
  },
  unexpected_response: {
    title: "Unexpected response",
    message: "The server responded, but not in the format this app expects.",
  },
};

export default function ErrorView({ kind = "request_failed", detail, onReset }) {
  const copy = ERROR_COPY[kind] || ERROR_COPY.request_failed;

  return (
    <div className="error-card fade-in">
      <div className="error-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="0.9" fill="currentColor" />
        </svg>
      </div>
      <h3>{copy.title}</h3>
      <p>{copy.message}</p>
      {detail && <p className="error-detail mono">{detail}</p>}
      <button className="btn btn-primary" onClick={onReset}>
        Try again
      </button>
    </div>
  );
}
