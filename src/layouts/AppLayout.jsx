import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import MobileMenu from "../components/MobileMenu";

import "./AppLayout.css";

function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <Sidebar />

      <div className="app-workspace">
        <DashboardHeader
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
}

export default AppLayout;