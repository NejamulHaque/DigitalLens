import React from "react";

const AboutModal = ({ onClose }) => {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="about-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-hdr">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>📰</span>
            <h3 style={{ margin: 0 }}>About DigitalLens</h3>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="drawer-body">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div className="logo-icon" style={{ fontSize: "64px", marginBottom: "16px" }}>📰</div>
            <h2 className="logo" style={{ fontSize: "32px" }}>DigitalLens</h2>
            <p className="tagline">Next-Generation AI News Aggregator</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <section>
              <h4 style={{ color: "var(--accent)", marginBottom: "8px", fontSize: "14px", textTransform: "uppercase" }}>The Vision</h4>
              <p style={{ fontSize: "15px", lineHeight: "1.6", color: "var(--text)" }}>
                DigitalLens is designed to cut through the noise of modern media. By combining real-time aggregation with 
                advanced sentiment analysis and AI-powered summarization, we empower users to stay informed without being overwhelmed.
              </p>
            </section>

            <section>
              <h4 style={{ color: "var(--accent)", marginBottom: "8px", fontSize: "14px", textTransform: "uppercase" }}>Core Technologies</h4>
              <ul style={{ paddingLeft: "18px", fontSize: "14px", color: "var(--text)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Glassmorphism UI:</strong> A premium design system built with React and Vanilla CSS.</li>
                <li><strong>AI Analysis:</strong> Powered by Anthropic's <strong>Claude 3.5 Sonnet</strong> for deep insights.</li>
                <li><strong>NLP Engine:</strong> Real-time sentiment analysis and summarization using HuggingFace Transformers.</li>
                <li><strong>FastAPI Backend:</strong> A high-performance Python backend with intelligent caching.</li>
              </ul>
            </section>

            <section>
              <h4 style={{ color: "var(--accent)", marginBottom: "8px", fontSize: "14px", textTransform: "uppercase" }}>Version 2.0</h4>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                Implemented professional features including multi-language translation, sentiment-based sorting, 
                and comprehensive reporting tools.
              </p>
            </section>
          </div>

          <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <button className="s-btn" onClick={onClose} style={{ width: "100%" }}>
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;