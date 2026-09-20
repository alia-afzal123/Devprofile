import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import ThemeToggle from "../components/ThemeToggle";

import resumeIcon from "../assets/icons/resume-icon.png";
import githubIcon from "../assets/icons/github-icon.png";
import portfolioIcon from "../assets/icons/portfolio-icon.png";

import "./Login.css";

const contributionCells = Array.from({ length: 12 });

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.38Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.89 6.62-2.39l-3.23-2.51c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.41 13.94A6.02 6.02 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.47H3.08A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.53l3.33-2.59Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.95 14.7 2 12 2a10 10 0 0 0-8.92 5.47l3.33 2.59C7.2 7.7 9.4 5.94 12 5.94Z"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

if (error) {
  if (error.message === "Invalid login credentials") {
    alert(
      "Email or password is incorrect. If you don't have an account yet, please Sign Up first. If you forgot your password, use Forgot Password."
    );
  } else if (error.message === "Email not confirmed") {
    alert("Please verify your email before logging in.");
  } else {
    alert(error.message || "Unable to log in. Please try again.");
  }

  return;
}

      console.log("Login successful:", data);

      navigate("/dashboard");
    } catch (error) {
      console.error("Unexpected login error:", error);
      alert("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error("Google login error:", error.message);
      alert("Google login error: " + error.message);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell">

        {/* Theme */}
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>

        {/* ==================================================
            Left Panel
        ================================================== */}
        <aside className="login-visual-panel">

          <Link to="/" className="login-brand">
            Dev<span>Profile</span>
          </Link>

          <div className="profile-showcase" aria-hidden="true">

            {/* Resume Preview */}
            <div className="showcase-resume">
              <div className="resume-top">
                <div className="resume-avatar" />

                <div className="resume-name">
                  <span />
                  <small />
                </div>
              </div>

              <div className="resume-section">
                <strong>EXPERIENCE</strong>

                <span />
                <span />
                <span className="short-line" />
              </div>

              <div className="resume-section">
                <strong>SKILLS</strong>

                <div className="resume-tags">
                  <i>React</i>
                  <i>API</i>
                  <i>Python</i>
                </div>
              </div>

              <div className="resume-status">
                <img src={resumeIcon} alt="" />
                <span>Resume</span>
              </div>
            </div>

            {/* GitHub Preview */}
            <div className="showcase-github">
              <div className="github-card-head">
                <div className="showcase-icon">
                  <img src={githubIcon} alt="" />
                </div>

                <div>
                  <strong>GitHub</strong>
                  <span>Developer Activity</span>
                </div>
              </div>

              <div className="repo-stat">
                <span>Repositories</span>
                <strong>12</strong>
              </div>

              <div className="github-activity">
                {contributionCells.map((_, index) => (
                  <i key={index} />
                ))}
              </div>
            </div>

            {/* Portfolio Preview */}
            <div className="showcase-portfolio">
              <div className="portfolio-browser-bar">
                <div>
                  <i />
                  <i />
                  <i />
                </div>

                <span>portfolio.dev</span>
              </div>

              <div className="portfolio-project">
                <div className="portfolio-thumbnail">
                  <img src={portfolioIcon} alt="" />
                </div>

                <div>
                  <strong>Featured Project</strong>
                  <span>Live project showcase</span>
                </div>
              </div>

              <div className="portfolio-project">
                <div className="project-placeholder" />

                <div>
                  <strong>Case Study</strong>
                  <span>Product experience</span>
                </div>
              </div>
            </div>

          </div>

          {/* Left Bottom Copy */}
          <div className="login-visual-copy">
            <h2>
              Your developer presence.
              <br />
              One clear picture.
            </h2>

            <p>
              Resume, GitHub and portfolio — brought together to help
              you improve what recruiters see.
            </p>

            <div className="visual-dots" aria-hidden="true">
              <span />
              <span className="active" />
              <span />
            </div>
          </div>

        </aside>

        {/* ==================================================
            Right Panel
        ================================================== */}
        <section className="login-form-panel">

          <div className="login-form-wrapper">

            <header className="login-heading">
              <span className="login-eyebrow">
                Welcome back
              </span>

              <h1>Sign in to DevProfile</h1>

              <p>
                Continue building a stronger developer profile.
              </p>
            </header>

            <form
              className="login-form"
              onSubmit={handleLogin}
            >

              {/* Email */}
              <div className="form-field">
                <label htmlFor="email">
                  Email
                </label>

                <div className="input-wrapper">
                  <span
                    className="input-icon"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4 6h16v12H4z" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                  </span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-field">

                <div className="password-label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  <Link to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>

                <div className="input-wrapper">
                  <span
                    className="input-icon"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24">
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                      />

                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Login */}
              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
                <span aria-hidden="true">→</span>
              </button>

              {/* Divider */}
              <div className="login-divider">
                <span />
                <p>or continue with</p>
                <span />
              </div>

              {/* Google Login */}
              <button
                type="button"
                className="google-login"
                onClick={handleGoogleLogin}
              >
                <span className="google-mark">
                  <GoogleIcon />
                </span>

                Continue with Google
              </button>

              {/* Signup */}
              <p className="signup-message">
                Don&apos;t have an account?{" "}

                <Link to="/signup">
                  Sign Up
                </Link>
              </p>

            </form>
          </div>

          <p className="login-footer">
            © 2026 DevProfile
          </p>

        </section>

      </section>
    </main>
  );
}

export default Login;