import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      <Navbar />

      <main className="hero-section">
        <div className="hero-container">
          {/* LEFT CONTENT */}
          <div className="hero-content">
            <div className="hero-badge">
              Developer Profile Intelligence
            </div>

            <h1>
              Know how strong your
              <span> developer profile </span>
              really is.
            </h1>

            <p className="hero-description">
              Analyze your Resume, GitHub, and Portfolio to uncover
              weaknesses, improve your professional presence, and become
              career ready.
            </p>

            <div className="hero-actions">
              <Link
  to="/signup"
  className="hero-primary-button"
>
  Start Free Analysis
  <span aria-hidden="true">→</span>
</Link>
            </div>

            <div className="hero-meta">
              <span>Resume</span>
              <i></i>
              <span>GitHub</span>
              <i></i>
              <span>Portfolio</span>
            </div>
          </div>

          {/* RIGHT VISUAL */}
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-glow"></div>

            <div className="hero-visual-top">
              <div>
                <span className="visual-eyebrow">
                  PROFILE SIGNALS
                </span>

                <h3>Your developer presence</h3>
              </div>

              <div className="visual-ready">
                <span></span>
                Analysis ready
              </div>
            </div>

            <div className="signal-list">
              {/* RESUME */}
              <div className="signal-card">
                <div className="signal-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 3h7l4 4v14H7V3Z" />
                    <path d="M14 3v5h5" />
                    <path d="M10 12h5M10 16h5" />
                  </svg>
                </div>

                <div className="signal-content">
                  <span>RESUME</span>
                  <strong>ATS & content quality</strong>

                  <div className="signal-progress">
                    <span style={{ width: "86%" }}></span>
                  </div>
                </div>

                <div className="signal-score">
                  <strong>86</strong>
                  <span>/100</span>
                </div>
              </div>

              {/* GITHUB */}
              <div className="signal-card">
                <div className="signal-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M9 17c-2 .5-2-1-3-1.5M12 18v-3c0-.8-.2-1.2-.6-1.6 2-.2 4.1-1 4.1-4.2 0-.9-.3-1.7-.9-2.3" />
                  </svg>
                </div>

                <div className="signal-content">
                  <span>GITHUB</span>
                  <strong>Projects & activity</strong>

                  <div className="signal-progress">
                    <span style={{ width: "82%" }}></span>
                  </div>
                </div>

                <div className="signal-score">
                  <strong>82</strong>
                  <span>/100</span>
                </div>
              </div>

              {/* PORTFOLIO */}
              <div className="signal-card">
                <div className="signal-icon">
                  <svg viewBox="0 0 24 24">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="15"
                      rx="2"
                    />
                    <path d="M8 5V3h8v2M3 10h18M10 14h4" />
                  </svg>
                </div>

                <div className="signal-content">
                  <span>PORTFOLIO</span>
                  <strong>Professional presence</strong>

                  <div className="signal-progress">
                    <span style={{ width: "85%" }}></span>
                  </div>
                </div>

                <div className="signal-score">
                  <strong>85</strong>
                  <span>/100</span>
                </div>
              </div>
            </div>

            {/* AI INSIGHT */}
            <div className="visual-insight">
              <div className="visual-insight-icon">✦</div>

              <div className="visual-insight-content">
                <span>AI-POWERED INSIGHTS</span>

                <p>
                  Find weaknesses and understand what to improve next.
                </p>
              </div>

              <strong className="visual-insight-arrow">→</strong>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;