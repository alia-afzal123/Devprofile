import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Sidebar.css";


const primaryNavigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "dashboard",
  },
  {
    label: "Resume Analyzer",
    path: "/resume-analyzer",
    icon: "resume",
  },
  {
    label: "GitHub Analyzer",
    path: "/github-analyzer",
    icon: "github",
  },
  {
    label: "Portfolio Analyzer",
    path: "/portfolio-analyzer",
    icon: "portfolio",
  },
  {
    label: "History",
    path: "/history",
    icon: "history",
  },
];


function RailIcon({ name }) {
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),

    resume: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M15 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h5" />
      </>
    ),

    github: (
      <>
        <path d="M9 19c-4 1.2-4-2-5-2.5" />
        <path d="M15 22v-3.2c0-.9.3-1.6.8-2-2.6-.3-5.3-1.3-5.3-5.8a4.5 4.5 0 0 1 1.2-3.1 4.2 4.2 0 0 1 .1-3.1s1-.3 3.2 1.2a11 11 0 0 1 5.8 0C23 4.5 24 4.8 24 4.8" />
      </>
    ),

    portfolio: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </>
    ),

    insights: (
      <>
        <path d="M5 20V12" />
        <path d="M10 20V5" />
        <path d="M15 20v-9" />
        <path d="M20 20V8" />
      </>
    ),

    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };


  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}


function Sidebar({ isMobileOpen = false, onClose })  {
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose?.();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      alert("Logout failed: " + error.message);
      return;
    }

    navigate("/login");
  };

return (
  <>
    <button
      type="button"
      className={`mobile-rail-overlay ${
        isMobileOpen ? "visible" : ""
      }`}
      onClick={onClose}
      aria-label="Close navigation"
    />

    <aside
      className={`command-rail ${
        isMobileOpen ? "mobile-open" : ""
      }`}
    >
<div className="mobile-rail-header">
  <span className="mobile-rail-title">DevProfile</span>

  <button
    type="button"
    className="mobile-rail-close"
    onClick={onClose}
    aria-label="Close navigation"
  >
    ×
  </button>
</div>
      {/* Brand */}
      <NavLink
        to="/dashboard"
        className="rail-brand"
        aria-label="DevProfile Dashboard"

      >
        <span className="rail-brand-symbol">
          D
        </span>
      </NavLink>


      {/* Main Navigation */}
      <nav
        className="rail-navigation"
        aria-label="DevProfile navigation"
      >
        {primaryNavigation.map((item) => (
          <NavLink
  key={item.path}
  to={item.path}
  aria-label={item.label}
  onClick={onClose}
  className={({ isActive }) =>
    isActive ? "rail-link active" : "rail-link"
  }
>
  <span className="rail-icon">
    <RailIcon name={item.icon} />
  </span>

  <span className="rail-label">
    {item.label}
  </span>

  <span className="rail-tooltip">
    {item.label}
  </span>
</NavLink>
        ))}
      </nav>


      {/* Bottom */}
      <div className="rail-footer">
        <NavLink
          to="/settings"
          className="rail-link"
          aria-label="Settings"
        >
          <span className="rail-icon">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9 6a7 7 0 0 0-1.7 1L5 6 3 9.5 5 11a7 7 0 0 0 0 2l-2 1.5L5 18l2.3-1a7 7 0 0 0 1.7 1l.5 3h5l.5-3a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z" />
            </svg>
          </span>

          <span className="rail-tooltip">
            Settings
          </span>
        </NavLink>


        <button
          type="button"
          className="rail-link rail-logout"
          aria-label="Logout"
           onClick={handleLogout}
        >
          <span className="rail-icon">
            <svg viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
            </svg>
          </span>
          <span className="rail-label">
  Settings
</span>

          <span className="rail-tooltip">
            Logout
          </span>
        </button>
      </div>

      </aside>
  </>
);
}


export default Sidebar;