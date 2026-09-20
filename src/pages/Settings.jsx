import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Settings.css";

function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
const [deleting, setDeleting] = useState(false);
const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load real logged-in user data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setErrorMessage("No authenticated user found.");
          return;
        }

        setEmail(user.email || "");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setName(profile?.full_name || "");
      } catch (error) {
        console.error("Failed to load settings:", error);
        setErrorMessage("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Save real profile changes
  const handleSave = async (event) => {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMessage("Full name is required.");
      return;
    }

    try {
      setSaving(true);
      setSaved(false);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setName(cleanName);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setErrorMessage("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to permanently delete your DevProfile account? This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    setDeleting(true);
    setDeleteError("");

    const { data, error } = await supabase.functions.invoke(
      "delete-account"
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.error || "Account deletion failed.");
    }

    await supabase.auth.signOut();

    window.location.href = "/";
  } catch (error) {
    console.error("Delete account failed:", error);
    setDeleteError(
      "Could not delete your account. Please try again."
    );
  } finally {
    setDeleting(false);
  }
};

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="settings-page">
      {/* PAGE HEADER */}
      <header className="settings-hero">
        <div className="settings-kicker">
          <span />
          ACCOUNT CONTROL
        </div>

        <h1>
          Settings<span>.</span>
        </h1>

        <p>
          Manage your profile, security and account preferences from one place.
        </p>
      </header>

      <div className="settings-simple-content">

        {/* ================= PROFILE ================= */}
        <section className="settings-panel settings-simple-section">
          <div className="settings-panel-heading">
            <div>
              <span>PROFILE</span>
              <h2>Personal information</h2>
              <p>
                Manage the information connected to your DevProfile account.
              </p>
            </div>

            <span className="settings-status">
              <i />
              Active
            </span>
          </div>

          <form className="settings-form" onSubmit={handleSave}>
            <div className="settings-avatar-editor">
              <div className="settings-large-avatar">
                {initials}
              </div>

              <div>
                <strong>{loading ? "Loading..." : name || "User"}</strong>
                <p>{email}</p>
              </div>
            </div>

            <div className="settings-field-grid">
              <div className="settings-field">
                <label htmlFor="settingsName">
                  Full name
                </label>

                <input
                  id="settingsName"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                    setErrorMessage("");
                  }}
                  disabled={loading}
                />
              </div>

              <div className="settings-field">
                <label htmlFor="settingsEmail">
                  Email address
                </label>

                <input
                  id="settingsEmail"
                  type="email"
                  value={email}
                  readOnly
                />
              </div>
            </div>

            <div className="settings-form-footer">
              <p>
                {errorMessage
                  ? errorMessage
                  : saved
                    ? "Profile updated successfully."
                    : "Your profile information is saved to your account."}
              </p>

              <button
                type="submit"
                disabled={saving || loading}
              >
                {saving ? "Saving..." : "Save Changes"}
                <span>→</span>
              </button>
            </div>
          </form>
        </section>

        {/* ================= SECURITY ================= */}
        <section className="settings-panel settings-simple-section">
          <div className="settings-panel-heading">
            <div>
              <span>SECURITY</span>
              <h2>Account security</h2>
              <p>
                Manage access to your DevProfile account.
              </p>
            </div>
          </div>

          <div className="security-list">
            <div className="security-row">
              <div className="security-icon">
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
              </div>

              <div>
                <strong>Password</strong>
                <p>
                  Change your password if you want to update
                  your account access.
                </p>
              </div>

              <Link to="/forgot-password">
                Change password
                <span>↗</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= ACCOUNT ================= */}
        <section className="settings-panel settings-simple-section">
          <div className="settings-panel-heading">
            <div>
              <span>ACCOUNT</span>
              <h2>Account & data</h2>
              <p>
                Manage your saved analyses and DevProfile account.
              </p>
            </div>
          </div>

          <div className="account-settings-list">

            {/* HISTORY */}
            <div className="account-setting-row">
              <div>
                <strong>Analysis history</strong>

                <p>
                  View your saved Resume, GitHub and Portfolio analyses.
                </p>
              </div>

              <Link to="/history">
                View history
                <span>↗</span>
              </Link>
            </div>

            {/* DELETE ACCOUNT */}
            <div className="account-setting-row danger">
              <div>
                <strong>Delete account</strong>

                <p>
                  Permanently delete your DevProfile account and saved data.
                </p>
              </div>

<button
  type="button"
  onClick={handleDeleteAccount}
  disabled={deleting}
>
  {deleting ? "Deleting..." : "Delete account"}
</button>
{deleteError && (
  <p className="settings-delete-error">
    {deleteError}
  </p>
)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;