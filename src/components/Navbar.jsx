import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <nav className="navbar">
        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
        >
          Dev<span>Profile</span>
        </Link>

        <div className="navbar-links">
          <NavLink
            to="/resume-analyzer"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Resume Analyzer
          </NavLink>

          <NavLink
            to="/github-analyzer"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            GitHub Analyzer
          </NavLink>

          <NavLink
            to="/portfolio-analyzer"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Portfolio Analyzer
          </NavLink>
        </div>

        <div className="navbar-actions">
          <ThemeToggle />

          <Link to="/login" className="login-link">
            Login
          </Link>

          <Link to="/signup" className="signup-button">
            Sign Up
          </Link>
<button
  type="button"
  className={`menu-button ${menuOpen ? "open" : ""}`}
  onClick={() => setMenuOpen((prev) => !prev)}
  aria-label="Toggle navigation menu"
  aria-expanded={menuOpen}
>
  <span></span>
  <span></span>
  <span></span>
</button>
        </div>

        <div className={`mobile-menu ${menuOpen ? "show" : ""}`}>
          <NavLink
            to="/resume-analyzer"
            onClick={closeMenu}
          >
            Resume Analyzer
          </NavLink>

          <NavLink
            to="/github-analyzer"
            onClick={closeMenu}
          >
            GitHub Analyzer
          </NavLink>

          <NavLink
            to="/portfolio-analyzer"
            onClick={closeMenu}
          >
            Portfolio Analyzer
          </NavLink>

          <NavLink
            to="/login"
            onClick={closeMenu}
          >
            Login
          </NavLink>

          <NavLink
            to="/signup"
            className="mobile-signup"
            onClick={closeMenu}
          >
            Sign Up
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;