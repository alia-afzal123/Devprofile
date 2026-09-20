import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        alert("Password update error: " + error.message);
        return;
      }

      alert("Password updated successfully.");
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-page">
      <section className="reset-card">

        <header className="reset-header">
          <span className="reset-eyebrow">
            Password Recovery
          </span>

          <h1>Create a new password</h1>

          <p>
            Choose a new password for your DevProfile account.
          </p>
        </header>

        <form
          className="reset-form"
          onSubmit={handleResetPassword}
        >
          <div className="reset-field">
            <label htmlFor="password">
              New Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="reset-field">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            className="reset-button"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="reset-back">
          Remember your password?{" "}
          <Link to="/login">
            Back to Login
          </Link>
        </p>

      </section>
    </main>
  );
}

export default ResetPassword;