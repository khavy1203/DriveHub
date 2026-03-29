import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

type SidebarProps = {
  collapsed: boolean;
  isMobile: boolean;
  onNavClick: () => void;
};

interface NavItem {
  label: string;
  icon: string;
  to?: string;
  children?: { label: string; to: string; icon: string }[];
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: 'dashboard', to: '/dashboard/home' },
  {
    label: 'Quản lý thi', icon: 'assignment',
    children: [
      { label: 'Kết quả thi',      icon: 'fact_check',      to: '/dashboard/exam-results' },
      { label: 'Học viên',         icon: 'school',          to: '/dashboard/hoc-vien' },
      { label: 'Đăng ký học viên', icon: 'person_add',      to: '/dashboard/dang-ky-hoc-vien' },

      { label: 'Giáo viên',        icon: 'manage_accounts', to: '/dashboard/teachers' },
    ],
  },
  {
    label: 'Cài đặt', icon: 'settings',
    children: [
      { label: 'Thiết lập chung',  icon: 'tune',        to: '/dashboard/setting' },
      { label: 'Upload File',      icon: 'upload_file', to: '/dashboard/upload' },
      { label: 'Máy in',           icon: 'print',       to: '/dashboard/printer' },
      { label: 'Bộ đề ôn tập',    icon: 'menu_book',   to: '/dashboard/review-sets' },
      { label: 'Import bộ ôn tập', icon: 'file_upload', to: '/dashboard/exam-sets-import' },
    ],
  },
  { label: 'Phân quyền', icon: 'admin_panel_settings', to: '/dashboard/phan-quyen' },
  { label: 'Tra cứu GPLX', icon: 'manage_search', to: '/license-check' },
];

const TEACHER_NAV_ITEMS: NavItem[] = [
  { label: 'Học viên của tôi', icon: 'school', to: '/dashboard/home' },
  { label: 'Tin nhắn', icon: 'chat', to: '/dashboard/chat' },
  { label: 'Tra cứu GPLX', icon: 'manage_search', to: '/license-check' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, isMobile, onNavClick }) => {
  const { displayName, role, avatarUrl } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Quản lý thi']);

  React.useEffect(() => {
    if (role === 'HocVien') setOpenGroups(['Cổng học viên']);
  }, [role]);

  const STUDENT_NAV_ITEMS: NavItem[] = [
    {
      label: 'Cổng học viên', icon: 'school',
      children: [
        { label: 'Tiến độ đào tạo',     icon: 'leaderboard',  to: '/dashboard/home?section=training'  },
        { label: 'Giáo viên của tôi',   icon: 'person',       to: '/dashboard/home?section=myteacher' },
        { label: 'Danh sách giáo viên', icon: 'group',        to: '/dashboard/home?section=teachers'  },
        { label: 'Tin nhắn',            icon: 'chat',         to: '/dashboard/chat'                   },
        { label: 'Thông tin cá nhân',   icon: 'manage_accounts', to: '/dashboard/home?section=profile' },
        { label: 'Đánh giá',            icon: 'rate_review',  to: '/dashboard/home?section=rate'      },
      ],
    },
    { label: 'Kết quả sát hạch', icon: 'fact_check', to: '/dashboard/ket-qua-sat-hanh' },
    { label: 'Tra cứu GPLX', icon: 'manage_search', to: '/license-check' },
  ];

  const navItems = role === 'GiaoVien' ? TEACHER_NAV_ITEMS : role === 'HocVien' ? STUDENT_NAV_ITEMS : ADMIN_NAV_ITEMS;

  const defaultAvatar = 'https://gravatar.com/avatar/d302cbc4526bf50e64befe198736824c?s=400&d=robohash&r=x';
  const resolvedAvatar = avatarUrl || defaultAvatar;

  const isActive = (to: string) => {
    const [toPath, toSearch] = to.split('?');
    if (toSearch) return location.pathname === toPath && location.search === `?${toSearch}`;
    return location.pathname === toPath || location.pathname.startsWith(toPath + '/');
  };
  const toggleGroup = (label: string) =>
    setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label]);

  const navExpanded = isMobile || !collapsed;
  const closeAfterNav = (): void => {
    if (isMobile) onNavClick();
  };

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
        {navItems.map(item => (
          <div key={item.label}>
            {item.to ? (
              <Link
                to={item.to}
                className={`db-nav-item ${isActive(item.to) ? 'active' : ''}`}
                title={!navExpanded ? item.label : undefined}
                onClick={closeAfterNav}
              >
                <i className="material-icons db-nav-icon">{item.icon}</i>
                {navExpanded && <span className="db-nav-label">{item.label}</span>}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className={`db-nav-item db-nav-group-btn ${openGroups.includes(item.label) ? 'open' : ''}`}
                  onClick={() => toggleGroup(item.label)}
                  title={!navExpanded ? item.label : undefined}
                >
                  <i className="material-icons db-nav-icon">{item.icon}</i>
                  {navExpanded && (
                    <>
                      <span className="db-nav-label">{item.label}</span>
                      <i className="material-icons db-nav-arrow">
                        {openGroups.includes(item.label) ? 'expand_less' : 'expand_more'}
                      </i>
                    </>
                  )}
                </button>
                {navExpanded && openGroups.includes(item.label) && (
                  <div className="db-nav-sub">
                    {item.children?.map(child => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={`db-nav-sub-item ${isActive(child.to) ? 'active' : ''}`}
                        onClick={closeAfterNav}
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
        {navExpanded && (
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
