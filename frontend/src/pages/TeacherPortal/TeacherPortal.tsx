import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { ChatPanel } from '../../features/chat';
import axios from '../../axios';
import './TeacherPortal.scss';

type HocVien = {
  id: number;
  HoTen: string;
  SoCCCD?: string;
  NgaySinh?: string;
  GioiTinh?: string;
  DiaChi?: string;
  loaibangthi?: string;
  phone?: string;
  email?: string;
  status: string;
};

type Assignment = {
  id: number;
  hocVienId: number;
  status: 'waiting' | 'learning' | 'completed';
  progressPercent: number;
  datHoursCompleted: number;
  notes?: string;
  createdAt: string;
  hocVien: HocVien;
};

type EditState = {
  status: Assignment['status'];
  progressPercent: number;
  datHoursCompleted: number;
  notes: string;
};

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Chờ bắt đầu',
  learning: 'Đang học',
  completed: 'Hoàn thành',
};

const HV_STATUS_LABEL: Record<string, string> = {
  registered: 'Đã đăng ký',
  assigned: 'Đã phân công',
  learning: 'Đang học',
  dat_completed: 'Hoàn thành DAT',
  exam_ready: 'Sẵn sàng thi',
};

const getInitials = (name: string) =>
  name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (raw?: string) => {
  if (!raw) return '—';
  try { return new Date(raw).toLocaleDateString('vi-VN'); } catch { return raw; }
};

type Props = { embedded?: boolean };

const TeacherPortal: React.FC<Props> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading, displayName, logout } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editMap, setEditMap] = useState<Record<number, EditState>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const fetchMyStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ EC: number; EM: string; DT: Assignment[] }>('/api/teacher/my-students');
      if (res.data.EC === 0) {
        setAssignments(res.data.DT);
      } else {
        toast.error(res.data.EM || 'Không tải được danh sách học viên');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMyStudents();
  }, [isAuthenticated, fetchMyStudents]);

  const handleExpand = (id: number, a: Assignment) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setEditMap(prev => ({
      ...prev,
      [id]: {
        status: a.status,
        progressPercent: a.progressPercent,
        datHoursCompleted: a.datHoursCompleted,
        notes: a.notes ?? '',
      },
    }));
  };

  const handleSave = async (assignmentId: number) => {
    const edit = editMap[assignmentId];
    if (!edit) return;
    setSaving(assignmentId);
    try {
      const res = await axios.put<{ EC: number; EM: string }>(`/api/student-assignment/${assignmentId}`, edit);
      if (res.data.EC === 0) {
        toast.success('Đã cập nhật tiến độ');
        setExpandedId(null);
        fetchMyStudents();
      } else {
        toast.error(res.data.EM || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSaving(null);
    }
  };

  const updateEdit = (id: number, patch: Partial<EditState>) => {
    setEditMap(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const filtered = assignments.filter(a => {
    const name = a.hocVien?.HoTen?.toLowerCase() ?? '';
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: assignments.length,
    waiting: assignments.filter(a => a.status === 'waiting').length,
    learning: assignments.filter(a => a.status === 'learning').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (isAuthLoading) {
    return (
      <div className="tp tp--center">
        <span className="material-icons tp__spin">sync</span>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className={embedded ? 'tp tp--embedded' : 'tp'}>
      {/* ── Top bar (standalone only) ─────────────────────────────────────── */}
      {!embedded && (
        <header className="tp__topbar">
          <div className="tp__brand">
            <span className="material-icons">directions_car</span>
            <span className="tp__brand-name">DriveHub</span>
            <span className="tp__brand-tag">Cổng Giáo Viên</span>
          </div>
          <div className="tp__topbar-right">
            <div className="tp__user-chip">
              <div className="tp__user-avatar">{getInitials(displayName ?? 'GV')}</div>
              <span>{displayName}</span>
            </div>
            <button className="tp__btn-logout" onClick={handleLogout}>
              <span className="material-icons">logout</span>
              Đăng xuất
            </button>
          </div>
        </header>
      )}

      <main className="tp__main">
        {/* ── Welcome ──────────────────────────────────────────────────────── */}
        <div className="tp__welcome">
          <div>
            <h1>Xin chào, {displayName} 👋</h1>
            <p>Quản lý tiến độ học viên được phân công cho bạn</p>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="tp__stats">
          <div className="tp__stat-card">
            <span className="material-icons">groups</span>
            <div>
              <p className="tp__stat-val">{stats.total}</p>
              <p className="tp__stat-label">Tổng học viên</p>
            </div>
          </div>
          <div className="tp__stat-card tp__stat-card--learning">
            <span className="material-icons">school</span>
            <div>
              <p className="tp__stat-val">{stats.learning}</p>
              <p className="tp__stat-label">Đang học</p>
            </div>
          </div>
          <div className="tp__stat-card tp__stat-card--done">
            <span className="material-icons">task_alt</span>
            <div>
              <p className="tp__stat-val">{stats.completed}</p>
              <p className="tp__stat-label">Hoàn thành</p>
            </div>
          </div>
          <div className="tp__stat-card tp__stat-card--wait">
            <span className="material-icons">hourglass_top</span>
            <div>
              <p className="tp__stat-val">{stats.waiting}</p>
              <p className="tp__stat-label">Chờ bắt đầu</p>
            </div>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="tp__filters">
          <div className="tp__search-wrap">
            <span className="material-icons">search</span>
            <input
              type="text"
              className="tp__search"
              placeholder="Tìm theo tên học viên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tp__search-clear" onClick={() => setSearch('')}>
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          <div className="tp__filter-tabs">
            {(['all', 'waiting', 'learning', 'completed'] as const).map(s => (
              <button
                key={s}
                className={`tp__filter-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Student list ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="tp__loading">
            <span className="material-icons tp__spin">sync</span>
            <p>Đang tải danh sách học viên...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="tp__empty">
            <span className="material-icons">person_search</span>
            <p>{assignments.length === 0 ? 'Bạn chưa được phân công học viên nào.' : 'Không tìm thấy học viên phù hợp.'}</p>
          </div>
        ) : (
          <div className="tp__list">
            {filtered.map(a => {
              const hv = a.hocVien;
              const isExpanded = expandedId === a.id;
              const edit = editMap[a.id];
              return (
                <div key={a.id} className={`tp__card ${isExpanded ? 'tp__card--open' : ''}`}>
                  {/* Card header */}
                  <div className="tp__card-header" onClick={() => handleExpand(a.id, a)}>
                    <div className="tp__card-avatar">{getInitials(hv.HoTen)}</div>
                    <div className="tp__card-info">
                      <div className="tp__card-name-row">
                        <span className="tp__card-name">{hv.HoTen}</span>
                        {hv.loaibangthi && (
                          <span className="tp__badge tp__badge--license">Hạng {hv.loaibangthi}</span>
                        )}
                        <span className={`tp__badge tp__badge--${a.status}`}>
                          {STATUS_LABEL[a.status]}
                        </span>
                      </div>
                      <div className="tp__card-meta">
                        {hv.phone && <span><span className="material-icons">phone</span>{hv.phone}</span>}
                        {hv.email && <span><span className="material-icons">email</span>{hv.email}</span>}
                        <span><span className="material-icons">calendar_today</span>Từ {formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                    <div className="tp__card-progress">
                      <div className="tp__progress-bar">
                        <div className="tp__progress-fill" style={{ width: `${a.progressPercent}%` }} />
                      </div>
                      <span className="tp__progress-pct">{a.progressPercent}%</span>
                    </div>
                    <button className="tp__expand-btn" aria-label="toggle">
                      <span className="material-icons">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>

                  {/* Expanded edit form */}
                  {isExpanded && edit && (
                    <div className="tp__card-body">
                      <div className="tp__detail-grid">
                        <div className="tp__detail-item">
                          <span className="tp__detail-label">Ngày sinh</span>
                          <span>{formatDate(hv.NgaySinh)}</span>
                        </div>
                        <div className="tp__detail-item">
                          <span className="tp__detail-label">CCCD</span>
                          <span>{hv.SoCCCD || '—'}</span>
                        </div>
                        <div className="tp__detail-item">
                          <span className="tp__detail-label">Trạng thái HV</span>
                          <span>{HV_STATUS_LABEL[hv.status] ?? hv.status}</span>
                        </div>
                        <div className="tp__detail-item">
                          <span className="tp__detail-label">Địa chỉ</span>
                          <span>{hv.DiaChi || '—'}</span>
                        </div>
                      </div>

                      <div className="tp__edit-section">
                        <h4 className="tp__edit-title">
                          <span className="material-icons">edit</span>
                          Cập nhật tiến độ
                        </h4>
                        <div className="tp__edit-grid">
                          <div className="tp__edit-field">
                            <label>Tiến độ ({edit.progressPercent}%)</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={edit.progressPercent}
                              onChange={e => updateEdit(a.id, { progressPercent: +e.target.value })}
                              className="tp__slider"
                            />
                            <div className="tp__slider-track-label">
                              <span>0%</span><span>50%</span><span>100%</span>
                            </div>
                          </div>
                          <div className="tp__edit-field">
                            <label>Trạng thái</label>
                            <select
                              value={edit.status}
                              onChange={e => updateEdit(a.id, { status: e.target.value as Assignment['status'] })}
                              className="tp__select"
                            >
                              <option value="waiting">Chờ bắt đầu</option>
                              <option value="learning">Đang học</option>
                              <option value="completed">Hoàn thành</option>
                            </select>
                          </div>
                          <div className="tp__edit-field">
                            <label>Số giờ DAT</label>
                            <input
                              type="number"
                              min={0}
                              value={edit.datHoursCompleted}
                              onChange={e => updateEdit(a.id, { datHoursCompleted: +e.target.value })}
                              className="tp__input"
                            />
                          </div>
                          <div className="tp__edit-field tp__edit-field--full">
                            <label>Ghi chú</label>
                            <textarea
                              value={edit.notes}
                              onChange={e => updateEdit(a.id, { notes: e.target.value })}
                              className="tp__textarea"
                              rows={2}
                              placeholder="Nhận xét về tiến độ học viên..."
                            />
                          </div>
                        </div>
                        <div className="tp__edit-actions">
                          <button
                            className="tp__btn-cancel"
                            onClick={() => setExpandedId(null)}
                          >
                            Huỷ
                          </button>
                          <button
                            className="tp__btn-save"
                            onClick={() => handleSave(a.id)}
                            disabled={saving === a.id}
                          >
                            {saving === a.id
                              ? <><span className="material-icons tp__spin">sync</span>Đang lưu...</>
                              : <><span className="material-icons">save</span>Lưu tiến độ</>
                            }
                          </button>
                        </div>
                      </div>

                      <div className="tp__chat-section">
                        <h4 className="tp__edit-title">
                          <span className="material-icons">chat</span>
                          Chat với học viên
                        </h4>
                        <ChatPanel
                          assignmentId={a.id}
                          label={`Chat với ${hv.HoTen}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherPortal;
