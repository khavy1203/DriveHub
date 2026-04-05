import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperTeacher } from '../hooks/useSuperTeacher';
import { useSuperTeacherStudents } from '../hooks/useSuperTeacherStudents';
import { fetchMyProfile } from '../services/superTeacherApi';
import type { InstructorProfile } from '../types';
import './SupperTeacherDashboard.scss';

const MAX_STUDENTS = 40;

const formatDate = (val?: string | null): string => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('vi-VN');
};

const SupperTeacherDashboard: React.FC = () => {
  const { teachers, loading: loadingT, loadTeachers } = useSuperTeacher();
  const { students, loading: loadingS, loadStudents } = useSuperTeacherStudents();
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeachers();
    loadStudents();
    fetchMyProfile().then(res => { if (res.EC === 0) setProfile(res.DT); }).catch(() => {});
  }, [loadTeachers, loadStudents]);

  const loading = loadingT || loadingS;

  // Stats
  const teacherStudentCounts = teachers.map(t => {
    const studs = students.filter(s => s.teacherId === t.id);
    const avgPct = studs.length > 0
      ? Math.round(studs.reduce((sum, s) => sum + (s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0), 0) / studs.length)
      : 0;
    return { id: t.id, name: t.username, count: studs.length, avgPct };
  });

  const unassignedCount = students.filter(s => !s.teacherId).length;
  const totalTeachers = teachers.length;
  const totalStudents = students.length;

  const studentsWithData = students.filter(s => s.hocVien?.trainingSnapshot);
  const completedCount = studentsWithData.filter(
    s => (s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0) >= 100,
  ).length;
  const passRate = studentsWithData.length > 0
    ? Math.round((completedCount / studentsWithData.length) * 100)
    : 0;
  const avgProgress = studentsWithData.length > 0
    ? Math.round(
        studentsWithData.reduce(
          (sum, s) => sum + (s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0), 0,
        ) / studentsWithData.length,
      )
    : 0;

  // Progress buckets
  const bucket0 = studentsWithData.filter(s => (s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0) < 25).length;
  const bucket25 = studentsWithData.filter(s => {
    const p = s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0;
    return p >= 25 && p < 50;
  }).length;
  const bucket50 = studentsWithData.filter(s => {
    const p = s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0;
    return p >= 50 && p < 75;
  }).length;
  const bucket75 = studentsWithData.filter(s => {
    const p = s.hocVien?.trainingSnapshot?.courseProgressPct ?? 0;
    return p >= 75 && p < 100;
  }).length;
  const bucketDone = completedCount;

  return (
    <div className="st-dashboard">
      {/* Header */}
      <section className="st-dashboard__header">
        <div>
          <h1 className="st-dashboard__title">Tổng quan Đội ngũ</h1>
          <p className="st-dashboard__subtitle">
            Theo dõi tình hình đào tạo, phân công và tiến độ học viên.
          </p>
        </div>
        <div className="st-dashboard__header-actions">
          {/* <button className="st-dashboard__btn-report" onClick={() => navigate('/dashboard/my-students')}>
            <span className="material-symbols-outlined">group</span>
            Danh sách học viên
          </button> */}
          {/* <button className="st-dashboard__btn-schedule" onClick={() => navigate('/dashboard/my-teachers')}>
            <span className="material-symbols-outlined">manage_accounts</span>
            Quản lý đội
          </button> */}
        </div>
      </section>

      {/* Stat Cards */}
      <section className="st-dashboard__stats">
        <div className="st-dashboard__stat-card" onClick={() => navigate('/dashboard/my-teachers')} style={{ cursor: 'pointer' }}>
          <div className="st-dashboard__stat-top">
            <div className="st-dashboard__stat-icon st-dashboard__stat-icon--teachers">
              <span className="material-symbols-outlined">person_pin</span>
            </div>
            <span className="st-dashboard__stat-badge st-dashboard__stat-badge--primary">
              Đội ngũ
            </span>
          </div>
          <p className="st-dashboard__stat-label">Giáo viên</p>
          <h2 className="st-dashboard__stat-value">{loading ? '—' : totalTeachers}</h2>
        </div>

        <div className="st-dashboard__stat-card" onClick={() => navigate('/dashboard/my-students')} style={{ cursor: 'pointer' }}>
          <div className="st-dashboard__stat-top">
            <div className="st-dashboard__stat-icon st-dashboard__stat-icon--students">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="st-dashboard__stat-badge st-dashboard__stat-badge--indigo">
              Toàn đội
            </span>
          </div>
          <p className="st-dashboard__stat-label">Học viên</p>
          <h2 className="st-dashboard__stat-value">{loading ? '—' : totalStudents}</h2>
        </div>

        <div className="st-dashboard__stat-card st-dashboard__stat-card--attention" onClick={() => navigate('/dashboard/assign-students')} style={{ cursor: 'pointer' }}>
          <div className="st-dashboard__stat-top">
            <div className="st-dashboard__stat-icon st-dashboard__stat-icon--waiting">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="st-dashboard__stat-badge st-dashboard__stat-badge--tertiary">
              Cần xử lý
            </span>
          </div>
          <p className="st-dashboard__stat-label">Chờ phân công</p>
          <h2 className="st-dashboard__stat-value">{loading ? '—' : unassignedCount}</h2>
        </div>

        <div className="st-dashboard__stat-card st-dashboard__stat-card--success">
          <div className="st-dashboard__stat-top">
            <div className="st-dashboard__stat-icon st-dashboard__stat-icon--rate">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="st-dashboard__stat-badge st-dashboard__stat-badge--success">
              {passRate >= 50 ? 'Tốt' : passRate > 0 ? 'Cần cải thiện' : '—'}
            </span>
          </div>
          <p className="st-dashboard__stat-label">Tỉ lệ hoàn thành</p>
          <h2 className="st-dashboard__stat-value">
            {loading ? '—' : studentsWithData.length > 0 ? `${passRate}%` : '—'}
          </h2>
        </div>
      </section>

      {/* My Profile Card */}
      {profile && (
        <section className="st-dashboard__profile">
          <div className="st-dashboard__profile-header">
            <div className="st-dashboard__profile-avatar">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="st-dashboard__profile-intro">
              <h3 className="st-dashboard__profile-name">{profile.fullName}</h3>
              <div className="st-dashboard__profile-meta">
                {profile.cccd && <span className="st-dashboard__profile-tag"><span className="material-symbols-outlined">fingerprint</span>{profile.cccd}</span>}
                {profile.gender && <span className="st-dashboard__profile-tag"><span className="material-symbols-outlined">wc</span>{profile.gender}</span>}
                {profile.dateOfBirth && <span className="st-dashboard__profile-tag"><span className="material-symbols-outlined">cake</span>{formatDate(profile.dateOfBirth)}</span>}
              </div>
            </div>
          </div>
          <div className="st-dashboard__profile-grid">
            <div className="st-dashboard__profile-section">
              <h4><span className="material-symbols-outlined">workspace_premium</span> Giấy chứng nhận</h4>
              <div className="st-dashboard__profile-fields">
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Số GCN GV</span>
                  <span className="st-dashboard__profile-field-value">{profile.gcnGvNumber || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Số GCN CS</span>
                  <span className="st-dashboard__profile-field-value">{profile.gcnCsNumber || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Ngày cấp GCN</span>
                  <span className="st-dashboard__profile-field-value">{formatDate(profile.gcnIssueDate)}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">HSD GCN GV</span>
                  <span className="st-dashboard__profile-field-value">{formatDate(profile.gcnGvExpiry)}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">HSD GCN CS</span>
                  <span className="st-dashboard__profile-field-value">{formatDate(profile.gcnCsExpiry)}</span>
                </div>
              </div>
            </div>
            <div className="st-dashboard__profile-section">
              <h4><span className="material-symbols-outlined">directions_car</span> Giấy phép & Trình độ</h4>
              <div className="st-dashboard__profile-fields">
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Hạng giảng dạy</span>
                  <span className="st-dashboard__profile-field-value">{profile.teachingLicenseClass || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Số GPLX</span>
                  <span className="st-dashboard__profile-field-value">{profile.licenseNumber || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Hạng GPLX</span>
                  <span className="st-dashboard__profile-field-value">{profile.licenseClass || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Trình độ chuyên môn</span>
                  <span className="st-dashboard__profile-field-value">{profile.qualification || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Trình độ văn hoá</span>
                  <span className="st-dashboard__profile-field-value">{profile.educationLevel || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Thâm niên</span>
                  <span className="st-dashboard__profile-field-value">{profile.seniority || '—'}</span>
                </div>
                <div className="st-dashboard__profile-field">
                  <span className="st-dashboard__profile-field-label">Xe giảng dạy</span>
                  <span className="st-dashboard__profile-field-value">{profile.teachingVehicle || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="st-dashboard__grid">
        {/* Left Column */}
        <div className="st-dashboard__left">
          {/* Student Distribution per teacher */}
          <div className="st-dashboard__distribution">
            <div className="st-dashboard__distribution-header">
              <div>
                <h3 className="st-dashboard__distribution-title">Phân bổ học viên</h3>
                <p className="st-dashboard__distribution-sub">Số lượng và tiến độ trung bình theo giáo viên</p>
              </div>
              <div className="st-dashboard__distribution-legend">
                <span className="st-dashboard__legend-dot st-dashboard__legend-dot--normal" />
                <span>Bình thường</span>
                <span className="st-dashboard__legend-dot st-dashboard__legend-dot--overloaded" style={{ marginLeft: '0.5rem' }} />
                <span>Quá tải (&gt;30)</span>
              </div>
            </div>
            <div className="st-dashboard__bars">
              {teacherStudentCounts.map(t => {
                const pct = Math.min(100, Math.round((t.count / MAX_STUDENTS) * 100));
                const overloaded = t.count > 30;
                return (
                  <div className="st-dashboard__bar-item" key={t.id}>
                    <div className="st-dashboard__bar-label">
                      <span>{t.name}</span>
                      <span>{t.count} học viên · TB {t.avgPct}%</span>
                    </div>
                    <div className="st-dashboard__bar-track">
                      <div
                        className={`st-dashboard__bar-fill ${overloaded ? 'st-dashboard__bar-fill--overloaded' : 'st-dashboard__bar-fill--normal'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {teacherStudentCounts.length === 0 && !loading && (
                <p style={{ color: '#6d7a77', fontSize: '0.875rem' }}>Chưa có giáo viên nào trong đội</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="st-dashboard__right">
          {/* Progress distribution */}
          <div className="st-dashboard__progress-dist">
            <h3 className="st-dashboard__progress-dist-title">Phân bố tiến độ học viên</h3>
            <p className="st-dashboard__progress-dist-sub">
              {studentsWithData.length} học viên có dữ liệu đào tạo
              {students.length - studentsWithData.length > 0 && (
                <> · {students.length - studentsWithData.length} chưa có dữ liệu</>
              )}
            </p>
            <div className="st-dashboard__bucket-list">
              {[
                { label: '0 – 24%', count: bucket0, color: '#ba1a1a' },
                { label: '25 – 49%', count: bucket25, color: '#c05400' },
                { label: '50 – 74%', count: bucket50, color: '#e6a100' },
                { label: '75 – 99%', count: bucket75, color: '#008378' },
                { label: '100%', count: bucketDone, color: '#00685f' },
              ].map(b => {
                const w = studentsWithData.length > 0 ? Math.round((b.count / studentsWithData.length) * 100) : 0;
                return (
                  <div className="st-dashboard__bucket" key={b.label}>
                    <div className="st-dashboard__bucket-header">
                      <span>{b.label}</span>
                      <span>{b.count} người</span>
                    </div>
                    <div className="st-dashboard__bucket-track">
                      <div
                        className="st-dashboard__bucket-fill"
                        style={{ width: `${w}%`, background: b.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insight */}
          <div className="st-dashboard__insight">
            <div className="st-dashboard__insight-glow" />
            <div className="st-dashboard__insight-badge">
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>Gợi ý thông minh</span>
            </div>
            <h4 className="st-dashboard__insight-title">Tối ưu phân bổ</h4>
            <p className="st-dashboard__insight-text">
              {unassignedCount > 0 ? (
                <>
                  Hiện có <strong>{unassignedCount} học viên</strong> chưa được phân công.
                  Hệ thống đề xuất phân bổ đều cho các giáo viên có tải thấp nhất.
                </>
              ) : totalStudents === 0 ? (
                'Chưa có học viên nào. Sử dụng Import CCCD để thêm học viên từ hệ thống đào tạo.'
              ) : (
                'Tất cả học viên đã được phân công. Hệ thống sẽ thông báo khi phát hiện tối ưu mới.'
              )}
            </p>
            {unassignedCount > 0 && (
              <button className="st-dashboard__insight-link" onClick={() => navigate('/dashboard/assign-students')}>
                Điều phối ngay
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Training Overview */}
          <div className="st-dashboard__success-rate">
            <h3 className="st-dashboard__success-title">Tổng quan đào tạo</h3>
            <div className="st-dashboard__success-hero">
              <div className="st-dashboard__success-value">
                {studentsWithData.length > 0 ? `${avgProgress}%` : '—'}
              </div>
              <div className="st-dashboard__success-trend">
                <span className="material-symbols-outlined">school</span>
                {completedCount}/{studentsWithData.length} hoàn thành
              </div>
            </div>
            <div className="st-dashboard__progress-row">
              <div className="st-dashboard__progress-label">
                <span>Tiến độ trung bình</span>
                <span>{studentsWithData.length > 0 ? `${avgProgress}%` : '—'}</span>
              </div>
              <div className="st-dashboard__progress-track">
                <div className="st-dashboard__progress-fill" style={{ width: `${avgProgress}%` }} />
              </div>
            </div>
            <div className="st-dashboard__progress-row">
              <div className="st-dashboard__progress-label">
                <span>Tỉ lệ hoàn thành</span>
                <span>{studentsWithData.length > 0 ? `${passRate}%` : '—'}</span>
              </div>
              <div className="st-dashboard__progress-track">
                <div className="st-dashboard__progress-fill st-dashboard__progress-fill--success" style={{ width: `${passRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SupperTeacherDashboard;
