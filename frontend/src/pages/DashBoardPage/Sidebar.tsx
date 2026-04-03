import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getDefaultAvatar } from "../../shared/utils/avatarUtils";

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

const SHARED_MGMT_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: 'dashboard', to: '/dashboard/home' },
  {
    label: 'Quản lý thi', icon: 'assignment',
    children: [
      { label: 'Học viên',         icon: 'school',            to: '/dashboard/hoc-vien' },
      { label: 'Đăng ký học viên', icon: 'person_add',        to: '/dashboard/dang-ky-hoc-vien' },
      { label: 'Phân công',        icon: 'assignment_ind',    to: '/dashboard/manual-assign' },
      { label: 'Giáo viên',        icon: 'manage_accounts',   to: '/dashboard/teachers' },
      { label: 'SupperTeacher',    icon: 'supervisor_account',to: '/dashboard/supper-teachers' },
    ],
  },
  { label: 'Tra cứu', icon: 'manage_search', to: '/lookup' },
];

const SETTINGS_ITEM: NavItem = {
  label: 'Cài đặt', icon: 'settings',
  children: [
    { label: 'Thiết lập chung',  icon: 'tune',        to: '/dashboard/setting' },
    { label: 'Upload File',      icon: 'upload_file', to: '/dashboard/upload' },
    { label: 'Máy in',           icon: 'print',       to: '/dashboard/printer' },
    { label: 'Bộ đề ôn tập',    icon: 'menu_book',   to: '/dashboard/review-sets' },
    { label: 'Import bộ ôn tập', icon: 'file_upload', to: '/dashboard/exam-sets-import' },
  ],
};

const SUPPER_ADMIN_NAV_ITEMS: NavItem[] = [
  ...SHARED_MGMT_ITEMS,
  SETTINGS_ITEM,
  { label: 'Thông báo',      icon: 'campaign',             to: '/dashboard/notifications' },
  { label: 'Quản lý Admin',  icon: 'domain',               to: '/dashboard/admin-management' },
  { label: 'Phân quyền',     icon: 'admin_panel_settings', to: '/dashboard/phan-quyen' },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  ...SHARED_MGMT_ITEMS,
  { label: 'Thông báo', icon: 'campaign', to: '/dashboard/notifications' },
  { label: 'Kết nối API', icon: 'cable', to: '/dashboard/api-config' },
];

const TEACHER_NAV_ITEMS: NavItem[] = [
  { label: 'Học viên của tôi', icon: 'school', to: '/dashboard/home' },
  { label: 'Tin nhắn', icon: 'chat', to: '/dashboard/chat' },
  { label: 'Tra cứu', icon: 'manage_search', to: '/lookup' },
];

const SUPPER_TEACHER_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: 'dashboard', to: '/dashboard/home' },
  {
    label: 'Đội của tôi', icon: 'groups',
    children: [
      { label: 'Giáo viên trong đội', icon: 'manage_accounts', to: '/dashboard/my-teachers' },
      { label: 'Học viên trong đội',  icon: 'school',          to: '/dashboard/my-students' },
      { label: 'Điều phối học viên',  icon: 'assignment_ind',  to: '/dashboard/assign-students' },
    ],
  },
  { label: 'Tin nhắn', icon: 'chat', to: '/dashboard/chat' },
  { label: 'Tra cứu', icon: 'manage_search', to: '/lookup' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, isMobile, onNavClick }) => {
  const { displayName, role, avatarUrl } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Quản lý thi']);

  React.useEffect(() => {
    if (role === 'HocVien') setOpenGroups(['Cổng học viên']);
    if (role === 'SupperTeacher') setOpenGroups(['Đội của tôi']);
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
    { label: 'Tra cứu', icon: 'manage_search', to: '/lookup' },
  ];

  const navItems =
    role === 'SupperTeacher' ? SUPPER_TEACHER_NAV_ITEMS :
    role === 'GiaoVien'      ? TEACHER_NAV_ITEMS :
    role === 'HocVien'       ? STUDENT_NAV_ITEMS :
    role === 'SupperAdmin'   ? SUPPER_ADMIN_NAV_ITEMS :
    ADMIN_NAV_ITEMS;

  const defaultAvatar = getDefaultAvatar(role);
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
      <Link to="/" className="db-sidebar-logo">
        <div className="db-logo-icon">
          <i className="material-icons">directions_car</i>
        </div>
        {!collapsed && <span className="db-logo-text">DriveHub</span>}
      </Link>

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
