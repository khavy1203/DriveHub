import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

interface SidebarProps { collapsed: boolean; }

interface NavItem {
  label: string;
  icon: string;
  to?: string;
  children?: { label: string; to: string; icon: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan',    icon: 'dashboard',      to: '/dashboard/exam-results' },
  { label: 'Tra cứu GPLX', icon: 'manage_search',  to: '/license-check' },
  {
    label: 'Cài đặt', icon: 'settings',
    children: [
      { label: 'Thiết lập chung', icon: 'tune',          to: '/dashboard/setting' },
      { label: 'Upload File',     icon: 'upload_file',    to: '/dashboard/upload' },
      { label: 'Máy in',          icon: 'print',          to: '/dashboard/printer' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { displayName, role, avatarUrl } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Cài đặt']);

  const defaultAvatar = 'https://gravatar.com/avatar/d302cbc4526bf50e64befe198736824c?s=400&d=robohash&r=x';
  const resolvedAvatar = avatarUrl || defaultAvatar;

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');
  const toggleGroup = (label: string) =>
    setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label]);

  return (
    <aside className="db-sidebar">
      {/* Logo */}
      <div className="db-sidebar-logo">
        <div className="db-logo-icon">
          <i className="material-icons">directions_car</i>
        </div>
        {!collapsed && <span className="db-logo-text">DriveHub</span>}
      </div>

      {/* Navigation */}
      <nav className="db-sidebar-nav">
        {NAV_ITEMS.map(item => (
          <div key={item.label}>
            {item.to ? (
              <Link
                to={item.to}
                className={`db-nav-item ${isActive(item.to) ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <i className="material-icons db-nav-icon">{item.icon}</i>
                {!collapsed && <span className="db-nav-label">{item.label}</span>}
              </Link>
            ) : (
              <>
                <button
                  className={`db-nav-item db-nav-group-btn ${openGroups.includes(item.label) ? 'open' : ''}`}
                  onClick={() => toggleGroup(item.label)}
                  title={collapsed ? item.label : undefined}
                >
                  <i className="material-icons db-nav-icon">{item.icon}</i>
                  {!collapsed && (
                    <>
                      <span className="db-nav-label">{item.label}</span>
                      <i className="material-icons db-nav-arrow">
                        {openGroups.includes(item.label) ? 'expand_less' : 'expand_more'}
                      </i>
                    </>
                  )}
                </button>
                {!collapsed && openGroups.includes(item.label) && (
                  <div className="db-nav-sub">
                    {item.children?.map(child => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={`db-nav-sub-item ${isActive(child.to) ? 'active' : ''}`}
                      >
                        <i className="material-icons">{child.icon}</i>
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* User profile at bottom */}
      <div className="db-sidebar-user">
        <img
          src={resolvedAvatar}
          alt="avatar"
          className="db-user-avatar"
          onError={e => { (e.currentTarget as HTMLImageElement).src = defaultAvatar; }}
        />
        {!collapsed && (
          <div className="db-user-info">
            <div className="db-user-name">{displayName || 'Admin'}</div>
            <div className="db-user-role">{role || 'Quản trị viên'}</div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
