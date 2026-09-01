import { useState } from "react";
import { API_BASE } from "./api";
import UploadZone from "./components/UploadZone";
import AnalysisResult from "./components/AnalysisResult";

function App() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleFileSelected(file) {
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
    setStatus("loading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // Surface the backend's actual error message when it has one
        // (e.g. "File must be an image"), rather than a generic failure.
        throw new Error(data?.detail || `Request failed (${res.status})`);
      }

      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Couldn't reach the server — is the backend running?"
          : err.message
      );
      setStatus("error");
    }
  }

  return (
    <div className="app">
      <h1>Deepfake Detector</h1>
      <p className="subtitle">
        Upload a photo to check for signs of AI-generated face manipulation.
      </p>

      <UploadZone onFileSelected={handleFileSelected} disabled={status === "loading"} />

      {previewUrl && (
        <img src={previewUrl} alt="Uploaded preview" className="preview-image" />
      )}

      <AnalysisResult status={status} result={result} error={error} />
    </div>
  );
}

export default App;
