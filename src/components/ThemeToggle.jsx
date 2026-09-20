import { useState } from "react";
import "./ThemeToggle.css";

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    const nextMode = !darkMode;

    setDarkMode(nextMode);

    document.body.classList.toggle(
      "dark-theme",
      nextMode
    );
  };

  return (
    <button
      type="button"
      className={`theme-toggle ${
        darkMode ? "dark" : ""
      }`}
      onClick={toggleTheme}
      aria-label={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      <span className="theme-icon sun-icon">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />

          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.42 1.42" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M4.93 19.07l1.42-1.41" />
          <path d="M17.66 6.34l1.41-1.41" />
        </svg>
      </span>

      <span className="toggle-knob"></span>

      <span className="theme-icon moon-icon">
        <svg viewBox="0 0 24 24">
          <path d="M20.5 14.2A8.3 8.3 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
        </svg>
      </span>
    </button>
  );
}

export default ThemeToggle;