import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { ChatPanel } from '../../features/chat';
import { useKQSHByStudent, KQSHCardList } from '../../features/kqsh';
import axios from '../../axios';
import { TrainingProgressBlock } from '../../features/trainingPortal';
import { buildClassGroups, shortCourseName, sortStudentsInGroup, type KhoaHocBrief } from '../../shared/studentClassGrouping';
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
  IDKhoaHoc?: string | null;
  khoahoc?: KhoaHocBrief | null;
  createdAt?: string;
  trainingProgressPct?: number | null;
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
  hasKQSH?: boolean;
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

  const [detailModal, setDetailModal] = useState<Assignment | null>(null);
  const [kqshModal, setKqshModal] = useState<{ hocVienId: number; hoTen: string } | null>(null);
  const [collapsedCourses, setCollapsedCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) navigate('/login');
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

  const filtered = assignments.filter(a => {
    const name = a.hocVien?.HoTen?.toLowerCase() ?? '';
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const courseGroups = useMemo(() => {
    const synthetic = filtered.map(a => ({
      ...a.hocVien,
      createdAt: a.hocVien.createdAt ?? a.createdAt,
    }));
    const built = buildClassGroups(synthetic, s => s.createdAt);
    const byHvId = new Map<number, Assignment>();
    filtered.forEach(a => byHvId.set(a.hocVien.id, a));
    return built.map(g => ({
      key: g.key,
      title: g.title,
      subtitle: g.subtitle,
      assignments: sortStudentsInGroup(g.students, 'name', 'asc')
        .map(s => byHvId.get(s.id))
        .filter((x): x is Assignment => x != null),
    }));
  }, [filtered]);

  const toggleCourseCollapsed = (key: string) => {
    setCollapsedCourses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const khoaHocLabel = (hv: HocVien): string | null => {
    const raw = hv.khoahoc?.TenKhoaHoc?.trim() || hv.IDKhoaHoc || null;
    return raw ? shortCourseName(raw) : null;
  };

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
        <div className="tp__welcome">
          <div>
            <h1>Xin chào, {displayName} 👋</h1>
            <p>Quản lý tiến độ học viên của bạn — nhóm theo tên khóa học (mới hơn lên trên)</p>
          </div>
        </div>

        {/* Stats */}
        <div className="tp__stats">
          {[
            { icon: 'groups',       val: stats.total,     label: 'Tổng học viên', mod: '' },
            { icon: 'school',       val: stats.learning,  label: 'Đang học',       mod: '--learning' },
            { icon: 'task_alt',     val: stats.completed, label: 'Hoàn thành',     mod: '--done' },
            { icon: 'hourglass_top',val: stats.waiting,   label: 'Chờ bắt đầu',   mod: '--wait' },
          ].map(s => (
            <div key={s.label} className={`tp__stat-card${s.mod ? ' tp__stat-card' + s.mod : ''}`}>
              <span className="material-icons">{s.icon}</span>
              <div>
                <p className="tp__stat-val">{s.val}</p>
                <p className="tp__stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
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

        {/* Student list */}
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
          <div className="tp__course-groups">
            {courseGroups.map(group => {
              const collapsed = collapsedCourses.has(group.key);
              const headLine = group.subtitle ? `${group.title} · ${group.subtitle}` : group.title;
              return (
                <section key={group.key} className="tp__course-block">
                  <button
                    type="button"
                    className="tp__course-head"
                    onClick={() => toggleCourseCollapsed(group.key)}
                    aria-expanded={!collapsed}
                  >
                    <span className="material-icons">{collapsed ? 'expand_more' : 'expand_less'}</span>
                    <div className="tp__course-head-text">
                      <p className="tp__course-head-name">Khóa học: {headLine}</p>
                      <p className="tp__course-head-sub">{group.assignments.length} học viên</p>
                    </div>
                    <span className="tp__course-count">{group.assignments.length}</span>
                  </button>
                  {!collapsed && (
                    <div className="tp__list">
                      {group.assignments.map(a => {
                        const hv = a.hocVien;
                        const kh = khoaHocLabel(hv);
                        const cardPct = Math.max(
                          a.progressPercent,
                          typeof hv.trainingProgressPct === 'number' ? hv.trainingProgressPct : 0,
                        );
                        return (
                          <div
                            key={a.id}
                            className="tp__card"
                            onClick={() => setDetailModal(a)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && setDetailModal(a)}
                            aria-label={`Xem chi tiết ${hv.HoTen}`}
                          >
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
                                {a.hasKQSH && (
                                  <span className="tp__badge tp__badge--kqsh">
                                    <span className="material-icons">verified</span>Đã sát hạch
                                  </span>
                                )}
                              </div>
                              <div className="tp__card-meta">
                                {kh && (
                                  <span title="Khóa học">
                                    <span className="material-icons">school</span>
                                    {kh}
                                  </span>
                                )}
                                {hv.phone && <span><span className="material-icons">phone</span>{hv.phone}</span>}
                                {hv.SoCCCD && <span><span className="material-icons">badge</span>{hv.SoCCCD}</span>}
                                <span><span className="material-icons">calendar_today</span>Từ {formatDate(a.createdAt)}</span>
                              </div>
                            </div>

                            <div className="tp__card-progress">
                              <div className="tp__progress-bar">
                                <div className="tp__progress-fill" style={{ width: `${cardPct}%` }} />
                              </div>
                              <span className="tp__progress-pct">{cardPct}%</span>
                            </div>

                            <span className="tp__card-arrow material-icons">chevron_right</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Student detail modal */}
      {detailModal && (
        <StudentDetailModal
          assignment={detailModal}
          onClose={() => setDetailModal(null)}
          onSaved={() => { fetchMyStudents(); setDetailModal(null); }}
          onKqsh={hv => setKqshModal({ hocVienId: hv.id, hoTen: hv.HoTen })}
        />
      )}

      {/* KQSH modal */}
      {kqshModal && (
        <KQSHModal
          hocVienId={kqshModal.hocVienId}
          hoTen={kqshModal.hoTen}
          onClose={() => setKqshModal(null)}
        />
      )}
    </div>
  );
};

/* ── Student Detail Modal ──────────────────────────────────────────────────── */

type DetailModalProps = {
  assignment: Assignment;
  onClose: () => void;
  onSaved: () => void;
  onKqsh: (hv: HocVien) => void;
};

const canEditAssignmentProgressRole = (role: string | null): boolean =>
  role === 'Admin' || role === 'SupperAdmin';

const StudentDetailModal: React.FC<DetailModalProps> = ({ assignment: a, onClose, onSaved, onKqsh }) => {
  const { role } = useAuth();
  const canEditProgress = canEditAssignmentProgressRole(role);
  const hv = a.hocVien;

  const [edit, setEdit] = useState<EditState>({
    status: a.status,
    progressPercent: a.progressPercent,
    datHoursCompleted: a.datHoursCompleted,
    notes: a.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const updateEdit = (patch: Partial<EditState>) => setEdit(prev => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = canEditProgress
        ? edit
        : { notes: edit.notes };
      const res = await axios.put<{ EC: number; EM: string }>(`/api/student-assignment/${a.id}`, payload);
      if (res.data.EC === 0) {
        toast.success(canEditProgress ? 'Đã cập nhật tiến độ' : 'Đã lưu ghi chú');
        onSaved();
      } else {
        toast.error(res.data.EM || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tp__overlay" role="dialog" aria-modal="true">
      <div className="tp__detail-modal" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="tp__dm-header">
          <div className="tp__dm-header-left">
            <div className="tp__dm-avatar">{getInitials(hv.HoTen)}</div>
            <div>
              <div className="tp__dm-name-row">
                <h2 className="tp__dm-name">{hv.HoTen}</h2>
                {hv.loaibangthi && (
                  <span className="tp__badge tp__badge--license">Hạng {hv.loaibangthi}</span>
                )}
                <span className={`tp__badge tp__badge--${a.status}`}>{STATUS_LABEL[a.status]}</span>
              </div>
              <div className="tp__dm-sub">
                {hv.SoCCCD && <span><span className="material-icons">badge</span>{hv.SoCCCD}</span>}
                {hv.phone && <span><span className="material-icons">phone</span>{hv.phone}</span>}
                {hv.DiaChi && <span><span className="material-icons">location_on</span>{hv.DiaChi}</span>}
              </div>
            </div>
          </div>
          <div className="tp__dm-header-actions">
            {a.hasKQSH && (
              <button
                className="tp__btn-kqsh"
                onClick={() => onKqsh(hv)}
              >
                <span className="material-icons">assignment</span>
                Kết quả sát hạch
              </button>
            )}
            <button className="tp__dm-close" onClick={onClose} aria-label="Đóng">
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        {/* Modal scrollable body */}
        <div className="tp__dm-body">
          {/* Quick info row */}
          <div className="tp__dm-info-grid">
            <div className="tp__dm-info-item">
              <span className="tp__dm-info-label">Ngày sinh</span>
              <span className="tp__dm-info-val">{formatDate(hv.NgaySinh)}</span>
            </div>
            <div className="tp__dm-info-item">
              <span className="tp__dm-info-label">Trạng thái HV</span>
              <span className="tp__dm-info-val">{HV_STATUS_LABEL[hv.status] ?? hv.status}</span>
            </div>
            <div className="tp__dm-info-item">
              <span className="tp__dm-info-label">Tiến độ phân công</span>
              <span className="tp__dm-info-val">{a.progressPercent}%</span>
            </div>
            <div className="tp__dm-info-item">
              <span className="tp__dm-info-label">Từ ngày</span>
              <span className="tp__dm-info-val">{formatDate(a.createdAt)}</span>
            </div>
          </div>

          <div className="tp__dm-section">
            <button
              type="button"
              className="tp__dm-section-toggle"
              onClick={() => setEditOpen(o => !o)}
            >
              <span className="material-icons">edit_note</span>
              <span>{canEditProgress ? 'Cập nhật tiến độ' : 'Ghi chú phân công'}</span>
              <span className="material-icons tp__dm-chevron">{editOpen ? 'expand_less' : 'expand_more'}</span>
            </button>
            {editOpen && (
              <div className="tp__dm-section-body">
                <div className="tp__edit-grid">
                  {canEditProgress ? (
                    <>
                      <div className="tp__edit-field">
                        <label>Tiến độ ({edit.progressPercent}%)</label>
                        <input
                          type="range" min={0} max={100}
                          value={edit.progressPercent}
                          onChange={e => updateEdit({ progressPercent: +e.target.value })}
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
                          onChange={e => updateEdit({ status: e.target.value as Assignment['status'] })}
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
                          type="number" min={0}
                          value={edit.datHoursCompleted}
                          onChange={e => updateEdit({ datHoursCompleted: +e.target.value })}
                          className="tp__input"
                        />
                      </div>
                    </>
                  ) : null}
                  <div className="tp__edit-field tp__edit-field--full">
                    <label>Ghi chú</label>
                    <textarea
                      value={edit.notes}
                      onChange={e => updateEdit({ notes: e.target.value })}
                      className="tp__textarea"
                      rows={canEditProgress ? 2 : 4}
                      placeholder={canEditProgress ? 'Nhận xét về tiến độ học viên...' : 'Ghi chú về học viên (chỉ Admin mới chỉnh % tiến độ, trạng thái, giờ DAT).'}
                    />
                  </div>
                </div>
                <div className="tp__edit-actions">
                  <button type="button" className="tp__btn-cancel" onClick={() => setEditOpen(false)}>Huỷ</button>
                  <button type="button" className="tp__btn-save" onClick={handleSave} disabled={saving}>
                    {saving
                      ? <><span className="material-icons tp__spin">sync</span>Đang lưu...</>
                      : <><span className="material-icons">save</span>{canEditProgress ? 'Lưu tiến độ' : 'Lưu ghi chú'}</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible: Chat */}
          <div className="tp__dm-section">
            <button
              className="tp__dm-section-toggle"
              onClick={() => setChatOpen(o => !o)}
            >
              <span className="material-icons">chat</span>
              <span>Chat với học viên</span>
              <span className="material-icons tp__dm-chevron">{chatOpen ? 'expand_less' : 'expand_more'}</span>
            </button>
            {chatOpen && (
              <div className="tp__dm-section-body">
                <ChatPanel assignmentId={a.id} label={`Chat với ${hv.HoTen}`} />
              </div>
            )}
          </div>

          {/* Training info — always visible, this is the main purpose of the modal */}
          <div className="tp__dm-training">
            <div className="tp__dm-training-header">
              <span className="material-icons">route</span>
              <span>Tiến độ đào tạo</span>
            </div>
            <TrainingProgressBlock mode="staff" cccd={hv.SoCCCD ?? null} compact />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── KQSH Modal ─────────────────────────────────────────────────────────────── */

type KQSHModalProps = { hocVienId: number; hoTen: string; onClose: () => void };

const KQSHModal: React.FC<KQSHModalProps> = ({ hocVienId, hoTen, onClose }) => {
  const { data, loading, error } = useKQSHByStudent(hocVienId, 'teacher');
  return (
    <div className="tp__overlay tp__overlay--above">
      <div className="tp__kqsh-modal" onClick={e => e.stopPropagation()}>
        <div className="tp__kqsh-modal-header">
          <div>
            <h3 className="tp__kqsh-modal-title">Kết quả sát hạch</h3>
            <p className="tp__kqsh-modal-sub">{hoTen}</p>
          </div>
          <button className="tp__kqsh-modal-close" onClick={onClose} aria-label="Đóng">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="tp__kqsh-modal-body">
          <KQSHCardList
            records={data?.records ?? []}
            loading={loading}
            error={error}
            emptyMessage="Học viên này chưa có dữ liệu sát hạch."
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherPortal;
