import { useCallback, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function UploadZone({
  selectedFile,
  previewUrl,
  onFileSelected,
  onRemove,
  onSubmit,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      // Soft client-side hint only — the backend remains the real source of
      // truth for validity (see main.py), so an unsupported type still
      // reaches the real error path rather than being silently dropped.
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  if (selectedFile && previewUrl) {
    return (
      <div className="upload-section">
        <div className="upload-preview fade-in">
          <div className="upload-preview-image-wrap">
            <img src={previewUrl} alt="Selected upload preview" />
          </div>
          <div className="upload-preview-actions">
            <span className="file-chip mono">{selectedFile.name}</span>
            <div className="action-row">
              <button className="btn btn-ghost btn-sm" onClick={onRemove}>
                Remove
              </button>
              <button className="btn btn-primary btn-sm" onClick={onSubmit}>
                Analyze Image
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-section">
      <div
        className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
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
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          id="file-input"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="dropzone-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4M12 4L7 9M12 4L17 9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="dropzone-title">Drop an image to analyze</p>
        <p className="dropzone-subtitle">or click to browse your files</p>
        <span
          className="browse-btn"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse files
        </span>
        <p className="format-note">JPG · PNG · WEBP</p>
      </div>
    </div>
  );
}
