import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useDashboardIsMobile } from "./useDashboardMedia";
import "./DashBoardPage.scss";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashBoardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useDashboardIsMobile();
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  const handleToggle = useCallback(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setMobileNavOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const shellClass = [
    "db-shell",
    collapsed ? "db-collapsed" : "",
    mobileNavOpen && isMobile ? "db-mobile-nav-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      {isMobile && (
        <button
          type="button"
          className="db-mobile-backdrop"
          aria-label="Đóng menu"
          onClick={closeMobileNav}
        />
      )}
      <Sidebar
        collapsed={collapsed}
        isMobile={isMobile}
        onNavClick={closeMobileNav}
      />
      <div className="db-body">
        <Header
          onToggle={handleToggle}
          collapsed={collapsed}
          mobileNavOpen={mobileNavOpen}
          isMobile={isMobile}
        />
        <main className="db-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashBoardLayout;
