import { useRef } from "react";

export default function UploadZone({ onFileSelected, disabled }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    // Reset so selecting the same file again still fires onChange
    e.target.value = "";
  }

  return (
    <div className="upload-zone">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        id="file-input"
      />
      <label htmlFor="file-input" className="upload-label">
        Choose an image
      </label>
    </div>
  );
}
