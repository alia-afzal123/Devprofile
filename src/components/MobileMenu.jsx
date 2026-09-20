import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./MobileMenu.css";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "▦",
  },
  {
    label: "Resume Analyzer",
    path: "/resume-analyzer",
    icon: "▤",
  },
  {
    label: "GitHub Analyzer",
    path: "/github-analyzer",
    icon: "◉",
  },
  {
    label: "Portfolio Analyzer",
    path: "/portfolio-analyzer",
    icon: "▣",
  },
  {
    label: "History",
    path: "/history",
    icon: "↶",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: "⚙",
  },
];

function MobileMenu({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      return;
    }

    onClose();
    navigate("/login");
  };

  return (
    <div className="mobile-menu-overlay" onClick={onClose}>
      <div
        className="mobile-menu-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mobile-menu-top">
          <span className="mobile-menu-title">
            <strong>Dev</strong>Profile
          </span>

          <button
            type="button"
            className="mobile-menu-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <nav className="mobile-menu-navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                isActive
                  ? "mobile-menu-item active"
                  : "mobile-menu-item"
              }
            >
              <span className="mobile-menu-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>

              <span className="mobile-menu-arrow">→</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="mobile-menu-item mobile-menu-logout"
          onClick={handleLogout}
        >
          <span className="mobile-menu-icon">↪</span>

          <span>Logout</span>

          <span className="mobile-menu-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

export default MobileMenu;