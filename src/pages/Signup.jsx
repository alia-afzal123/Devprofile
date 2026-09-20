import { supabase } from "../lib/supabase";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import resumeIcon from "../assets/icons/resume-icon.png";
import githubIcon from "../assets/icons/github-icon.png";
import portfolioIcon from "../assets/icons/portfolio-icon.png";
import "./Login.css";
import "./Signup.css";

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

function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
const handleSignup = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      alert("Signup error: " + error.message);
      console.error(error);
      return;
    }

    console.log("Signup successful:", data);
if (data.user) {
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: data.user.id,
      full_name: fullName,
      avatar_url: null,
    });

  if (profileError) {
    console.error("Profile creation error:", profileError);
  }
}
    if (data.session) {
      navigate("/dashboard");
    } else {
      alert("Account created. Please verify your email and then login.");
      navigate("/login");
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
};
  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Google signup error:", error.message);
    }
  };

  return (
    <main className="login-page signup-page">
      <section className="login-shell signup-shell">

        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>

        <aside className="login-visual-panel">

          <Link to="/" className="login-brand">
            Dev<span>Profile</span>
          </Link>

          <div className="profile-showcase" aria-hidden="true">

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

          <div className="login-visual-copy">
            <h2>
              Build a stronger profile.
              <br />
              Start with clarity.
            </h2>

            <p>
              Bring your resume, GitHub and portfolio together and
              understand how your developer presence really looks.
            </p>

            <div className="visual-dots" aria-hidden="true">
              <span />
              <span />
              <span className="active" />
            </div>
          </div>

        </aside>

        <section className="login-form-panel signup-form-panel">
          <div className="login-form-wrapper signup-form-wrapper">

            <header className="login-heading signup-heading">
              <span className="login-eyebrow">
                Get started
              </span>

              <h1>Create your DevProfile</h1>

              <p>
                Create your account and start improving your developer
                presence.
              </p>
            </header>

            <form
              className="login-form signup-form"
              onSubmit={handleSignup}
            >

              <div className="form-field">
                <label htmlFor="fullName">
                  Full Name
                </label>

                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                  </span>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Your full name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="signupEmail">
                  Email
                </label>

                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 6h16v12H4z" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                  </span>

                  <input
                    id="signupEmail"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="signupPassword">
                  Password
                </label>

                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
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
                    id="signupPassword"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
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
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <label className="terms-row">
                <input
                  type="checkbox"
                  name="terms"
                  required
                />

                <span>
                  I agree to the{" "}
                  <Link to="/terms">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                className="login-submit"
              >
                Create Account
                <span aria-hidden="true">→</span>
              </button>

              <div className="login-divider signup-divider">
                <span />
                <p>or continue with</p>
                <span />
              </div>

              <button
                type="button"
                className="google-login"
                onClick={handleGoogleSignup}
              >
                <span className="google-mark">
                  <GoogleIcon />
                </span>

                Continue with Google
              </button>

              <p className="signup-message">
                Already have an account?{" "}
                <Link to="/login">
                  Login
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

export default Signup;