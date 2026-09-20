import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

import ThemeToggle from "../components/ThemeToggle";

import "./Login.css";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

const handleForgotPassword = async (event) => {
  event.preventDefault();

  const cleanEmail = email.trim();

  if (!cleanEmail) {
    alert("Please enter your email.");
    return;
  }

  setLoading(true);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: "http://localhost:5173/reset-password",
      }
    );

    if (error) {
      alert("Reset error: " + error.message);
      return;
    }

    alert("Password reset link sent. Check your email.");
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="login-page">
      <section className="login-shell forgot-shell">

        {/* Theme Toggle */}
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>

        {/* Left Panel */}
        <aside className="login-visual-panel forgot-visual-panel">

          <Link to="/" className="login-brand">
            Dev<span>Profile</span>
          </Link>

          <div className="forgot-visual" aria-hidden="true">
            <div className="forgot-icon-card">
              <svg viewBox="0 0 24 24">
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                />

                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v2" />
              </svg>
            </div>

            <div className="forgot-line forgot-line-one" />
            <div className="forgot-line forgot-line-two" />
            <div className="forgot-line forgot-line-three" />
          </div>

          <div className="login-visual-copy">
            <h2>
              Get back to your profile.
              <br />
              Securely.
            </h2>

            <p>
              Enter your account email and we&apos;ll help you reset
              your password securely.
            </p>
          </div>

        </aside>

        {/* Right Panel */}
        <section className="login-form-panel">

          <div className="login-form-wrapper">

            <header className="login-heading">
              <span className="login-eyebrow">
                Password recovery
              </span>

              <h1>Forgot your password?</h1>

              <p>
                Enter the email connected to your DevProfile account.
              </p>
            </header>

            <form
              className="login-form"
              onSubmit={handleForgotPassword}
            >

              {/* Email */}
              <div className="form-field">
                <label htmlFor="resetEmail">
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
                    id="resetEmail"
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

              {/* Submit */}
              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
                <span aria-hidden="true">→</span>
              </button>

              {/* Back to Login */}
              <p className="signup-message forgot-back">
                Remember your password?{" "}

                <Link to="/login">
                  Back to Login
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

export default ForgotPassword;