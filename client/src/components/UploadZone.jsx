import { useCallback, useRef, useState } from "react";

export default function UploadZone({ onFileSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Deliberately no client-side type filtering here: the backend is the
  // single source of truth for "is this a valid image" (see main.py) and
  // returns a clear error message when it isn't. Filtering here too would
  // mean invalid files get silently dropped with zero feedback instead of
  // reaching the real error path — worse than showing the actual error.
  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      className={`dropzone corner-frame ${isDragging ? "dropzone-active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        id="file-input"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="dropzone-content">
        <div className="dropzone-icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4M12 4L7 9M12 4L17 9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="dropzone-title">Drop an image to analyze</p>
        <p className="dropzone-subtitle">or click to browse — JPG, PNG</p>
      </div>
    </div>
  );
}
