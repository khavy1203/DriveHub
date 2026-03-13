import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DashBoardPage.scss";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashBoardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`db-shell ${collapsed ? 'db-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="db-body">
        <Header onToggle={() => setCollapsed(c => !c)} collapsed={collapsed} />
        <main className="db-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashBoardLayout;
