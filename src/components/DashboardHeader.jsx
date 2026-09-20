import { useLocation } from "react-router-dom";

import ThemeToggle from "./ThemeToggle";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./DashboardHeader.css";


const pageTitles = {
  "/dashboard": "Dashboard",
  "/resume-analyzer": "Resume Analyzer",
  "/github-analyzer": "GitHub Analyzer",
  "/portfolio-analyzer": "Portfolio Analyzer",
  "/insights": "Insights",
  "/history": "History",
  "/settings": "Settings",
};


function DashboardHeader({ onMenuClick }) {
  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] ?? "DevProfile";

const [profile, setProfile] = useState(null);

useEffect(() => {
  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile load error:", error);
      return;
    }

    setProfile(data);
  };

  loadProfile();
}, []);

const initials = profile?.full_name
  ? profile.full_name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  : "U";
  return (
    <header className="dashboard-header">

      <div className="dashboard-header-left">

        <button
          type="button"
          className="dashboard-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <span />
          <span />
          <span />
        </button>


        <div>
  <span className="dashboard-header-label">
    DevProfile
  </span>

  <div className="dashboard-welcome">
    Welcome, {profile?.full_name  || "User"}👋
  </div>

  <h1>{pageTitle}</h1>
</div>

      </div>


      <div className="dashboard-header-actions">
        <ThemeToggle />

        <button
          type="button"
          className="header-profile-button"
          aria-label="Open profile"
        >
          <span>{initials}</span>
        </button>
      </div>

    </header>
  );
}


export default DashboardHeader;