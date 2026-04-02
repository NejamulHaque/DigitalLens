import React, { useState } from "react";

const DeveloperSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`dev-section glass ${isExpanded ? "expanded" : ""}`}>
      <div className="dev-trigger" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="dev-avatar">👨‍💻</div>
        {!isExpanded && <span className="dev-label">Developer</span>}
        {isExpanded && <span className="dev-close">✕</span>}
      </div>

      {isExpanded && (
        <div className="dev-content">
          <div className="dev-info">
            <h4>Nejamul Haque</h4>
            <p className="dev-role">Full Stack, AI Developer & Researcher</p>
            <p className="dev-bio">
              Passionate about building intelligent systems that bridge the gap between complex AI and user-friendly interfaces.
            </p>
            <div className="dev-meta">
              <span>🚀 3+ Years Exp</span>
              <span>🛠️ React, Python, Claude</span>
            </div>
            <div className="dev-links">
              <a href="https://github.com/NejamulHaque" target="_blank" rel="noreferrer">GitHub</a>
              <a href="mailto:nejamulhaque05@gmail.com">Contact</a>
            </div>
          </div>

          <div className="dev-divider" />

          <div className="dev-contribution">
            <p className="contrib-title">Support the Project</p>
            <div className="qr-wrap">
              <img src="/upi_qr.png" alt="UPI QR Code" className="qr-img" />
            </div>
            <p className="upi-id">UPI: <strong>nejamulhaque@freecharge</strong></p>
            <p className="contrib-note">Your support helps keep Digital Lens independent and free.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperSection;
