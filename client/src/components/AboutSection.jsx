import { forwardRef } from "react";

const AboutSection = forwardRef(function AboutSection(_props, ref) {
  return (
    <section id="about" ref={ref} className="section">
      <div className="section-header">
        <p className="section-label">About</p>
        <h2>About &amp; limitations</h2>
      </div>

      <div className="about-content">
        <p>
          This tool uses <strong>MesoNet</strong> (Meso4), a compact
          convolutional neural network described in{" "}
          <em>"MesoNet: a Compact Facial Video Forgery Detection Network"</em>{" "}
          (Afchar et al., 2018), trained on the FaceForensics++ dataset.
          Face detection is handled by OpenCV's Haar Cascade classifier,
          verified with a secondary eye-detection stage to reduce false
          positives on textured, non-face regions such as patterned fabric.
        </p>
        <p>
          <strong>This is an AI estimate, not a verified fact.</strong>{" "}
          Independent evaluation against a labeled, held-out dataset (kept
          separate from the model's own reference samples) measured{" "}
          <strong>62.4% accuracy</strong> — the model is substantially better
          at confirming real images (85% recall) than at catching actual
          manipulated ones (40% recall). It should be treated as one signal
          among several, never a final verdict on its own.
        </p>
        <p>
          All image analysis happens server-side for each request — no scan
          history is stored on the server, and nothing here is a persistent
          per-user record.
        </p>
      </div>
    </section>
  );
});

export default AboutSection;
