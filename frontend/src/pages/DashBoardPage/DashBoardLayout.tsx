import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useDashboardIsMobile } from "./useDashboardMedia";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useAdminFilter } from "../../features/auth/context/AdminFilterContext";
import "./DashBoardPage.scss";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const AdminFilterBar: React.FC = () => {
  const { selectedAdminId, setSelectedAdminId, adminList, loadingAdmins } = useAdminFilter();
  return (
    <div className="db-admin-filter">
      <span className="material-icons db-admin-filter__icon">corporate_fare</span>
      <span className="db-admin-filter__label">Đơn vị:</span>
      <select
        className="db-admin-filter__select"
        value={selectedAdminId ?? ''}
        onChange={e => setSelectedAdminId(e.target.value ? Number(e.target.value) : null)}
        disabled={loadingAdmins}
      >
        <option value="">— Tất cả đơn vị —</option>
        {adminList.map(a => (
          <option key={a.id} value={a.id}>
            {a.username} ({a.email})
          </option>
        ))}
      </select>
      {selectedAdminId && (
        <button className="db-admin-filter__clear" onClick={() => setSelectedAdminId(null)} title="Bỏ lọc">
          <span className="material-icons">close</span>
        </button>
      )}
    </div>
  );
};

const DashBoardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { role } = useAuth();
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
        {role === 'SupperAdmin' && <AdminFilterBar />}
        <main className="db-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashBoardLayout;
