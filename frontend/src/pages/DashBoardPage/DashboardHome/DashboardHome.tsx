import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useApiService from '../../../services/useApiService';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import KQSHSyncPanel from '../KQSHPage/KQSHSyncPanel';
import './DashboardHome.scss';

type StatCard = {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  to: string;
};

type Course = { IDKhoaHoc: string; TenKhoaHoc?: string };
type RankItem = { id: number; name: string };

const SUPPER_ADMIN_ONLY_ROUTES = new Set([
  '/dashboard/exam-results',
  '/dashboard/review-sets',
  '/dashboard/exam-sets-import',
  '/dashboard/upload',
  '/dashboard/setting',
  '/dashboard/printer',
]);

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { get } = useApiService();
  const { role } = useAuth();
  const isSupperAdmin = role === 'SupperAdmin';
  const isAdmin = role === 'Admin';

  const [courses, setCourses] = useState<Course[]>([]);
  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get<{ EC: number; DT: Course[] }>('/api/course'),
      get<{ EC: number; DT: RankItem[] }>('/api/rank/getRank'),
    ])
      .then(([courseRes, rankRes]) => {
        if (courseRes.EC === 0) setCourses(courseRes.DT ?? []);
        if (rankRes.EC === 0) setRanks(rankRes.DT ?? []);
      })
      .finally(() => setLoading(false));
  // get reference changes every render — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats: StatCard[] = [
    {
      icon: 'people',
      label: 'Quản lý thí sinh',
      value: '—',
      color: 'blue',
      to: isSupperAdmin ? '/dashboard/students' : '/dashboard/hoc-vien',
    },
    ...(isSupperAdmin ? [
      {
        icon: 'school',
        label: 'Khoá học',
        value: loading ? '...' : courses.length,
        color: 'green',
        to: '/dashboard/exam-results',
      },
      {
        icon: 'badge',
        label: 'Hạng bằng lái',
        value: loading ? '...' : ranks.length,
        color: 'orange',
        to: '/dashboard/exam-results',
      },
    ] as StatCard[] : []),
    {
      icon: 'manage_accounts',
      label: 'Giáo viên / Tài khoản',
      value: '—',
      color: 'purple',
      to: '/dashboard/teachers',
    },
  ];

  const allQuickLinks = [
    { icon: 'assignment',      label: 'Kết quả thi',      to: '/dashboard/exam-results' },
    { icon: 'school',          label: 'Học viên',          to: '/dashboard/hoc-vien' },
    { icon: 'manage_accounts', label: 'Giáo viên',         to: '/dashboard/teachers' },
    { icon: 'menu_book',       label: 'Bộ đề ôn tập',      to: '/dashboard/review-sets' },
    { icon: 'file_upload',     label: 'Import bộ ôn tập',  to: '/dashboard/exam-sets-import' },
    { icon: 'upload_file',     label: 'Upload dữ liệu',    to: '/dashboard/upload' },
    { icon: 'tune',            label: 'Thiết lập chung',   to: '/dashboard/setting' },
    { icon: 'print',           label: 'Máy in',            to: '/dashboard/printer' },
  ];
  const quickLinks = allQuickLinks.filter(l => isSupperAdmin || !SUPPER_ADMIN_ONLY_ROUTES.has(l.to));

  return (
    <div className="dbh">
      <div className="dbh__header">
        <h1 className="dbh__title">Tổng quan hệ thống</h1>
        <p className="dbh__subtitle">DriveHub — Quản lý thi sát hạch lái xe</p>
      </div>

      {/* Stat cards */}
      <div className="dbh__stats">
        {stats.map((s) => (
          <button
            key={s.label}
            className={`dbh__stat dbh__stat--${s.color}`}
            onClick={() => navigate(s.to)}
          >
            <div className="dbh__stat-icon">
              <span className="material-icons">{s.icon}</span>
            </div>
            <div className="dbh__stat-body">
              <span className="dbh__stat-value">{s.value}</span>
              <span className="dbh__stat-label">{s.label}</span>
            </div>
            <span className="material-icons dbh__stat-arrow">arrow_forward</span>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="dbh__section">
        <h2 className="dbh__section-title">Truy cập nhanh</h2>
        <div className="dbh__links">
          {quickLinks.map((l) => (
            <button
              key={l.to}
              className="dbh__link-btn"
              onClick={() => navigate(l.to)}
            >
              <span className="material-icons">{l.icon}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KQSH Sync — Admin only (relies on API config) */}
      {isAdmin && (
        <div className="dbh__section">
          <h2 className="dbh__section-title">Đồng bộ dữ liệu</h2>
          <KQSHSyncPanel />
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
