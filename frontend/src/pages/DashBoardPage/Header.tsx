import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import ProfileEditModal from "./ProfileEditModal";
import { getDefaultAvatar } from "../../shared/utils/avatarUtils";

interface DashHeaderProps {
  onToggle: () => void;
  collapsed: boolean;
  mobileNavOpen: boolean;
  isMobile: boolean;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard/exam-results': 'Tổng quan',
  '/dashboard/setting':      'Thiết lập chung',
  '/dashboard/upload':       'Upload dữ liệu',
  '/dashboard/printer':      'Máy in',
  '/dashboard':              'Dashboard',
};

const Header: React.FC<DashHeaderProps> = ({
  onToggle,
  collapsed,
  mobileNavOpen,
  isMobile,
}) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { displayName, role, avatarUrl, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const defaultAvatar = getDefaultAvatar(role);
  const resolvedAvatar = avatarUrl || defaultAvatar;
  const pageName = BREADCRUMB_MAP[location.pathname] || 'Dashboard';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="db-header">
      <div className="db-header-left">
        <button
          className="db-toggle-btn"
          onClick={onToggle}
          title={
            isMobile
              ? mobileNavOpen
                ? 'Đóng menu'
                : 'Mở menu'
              : collapsed
                ? 'Mở rộng'
                : 'Thu gọn'
          }
          aria-expanded={isMobile ? mobileNavOpen : undefined}
        >
          <i className="material-icons">
            {isMobile ? (mobileNavOpen ? 'close' : 'menu') : collapsed ? 'menu_open' : 'menu'}
          </i>
        </button>
        <div className="db-breadcrumb">
          <span className="db-breadcrumb-root">Dashboard</span>
          {pageName !== 'Dashboard' && (
            <>
              <i className="material-icons db-breadcrumb-sep">chevron_right</i>
              <span className="db-breadcrumb-current">{pageName}</span>
            </>
          )}
        </div>
      </div>

      <div className="db-header-right">
        <div className="db-header-page-name">{pageName}</div>
        <div className="db-profile" ref={menuRef}>
          <button className="db-profile-btn" onClick={() => setMenuOpen(o => !o)}>
            <img
              src={resolvedAvatar} alt="avatar" className="db-profile-avatar"
              onError={e => { (e.currentTarget as HTMLImageElement).src = defaultAvatar; }}
            />
            <div className="db-profile-info">
              <span className="db-profile-name">{displayName || 'Admin'}</span>
              <span className="db-profile-role">{role || 'Quản trị viên'}</span>
            </div>
            <i className="material-icons db-profile-chevron">{menuOpen ? 'expand_less' : 'expand_more'}</i>
          </button>

          {menuOpen && (
            <div className="db-profile-menu">
              <div className="db-profile-menu-user">
                <img src={resolvedAvatar} alt="avatar" onError={e => { (e.currentTarget as HTMLImageElement).src = defaultAvatar; }} />
                <div>
                  <div className="db-pm-name">{displayName || 'Admin'}</div>
                  <div className="db-pm-role">{role || 'Quản trị viên'}</div>
                </div>
              </div>
              <div className="db-profile-menu-divider" />
              <button className="db-pm-item" onClick={() => { setMenuOpen(false); setEditOpen(true); }}>
                <i className="material-icons">manage_accounts</i>
                Chỉnh sửa hồ sơ
              </button>
              <div className="db-profile-menu-divider" />
              <button className="db-pm-item db-pm-logout" onClick={handleLogout}>
                <i className="material-icons">logout</i>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {editOpen && <ProfileEditModal onClose={() => setEditOpen(false)} />}
    </header>
  );
};

export default Header;
