import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useApiService from '../../../services/useApiService';
import './HocVienManagement.scss';

type Teacher = { id: number; username: string; email: string; phone?: string };

type Assignment = {
  id: number;
  hocVienId: number;
  teacherId: number;
  courseId: string;
  status: 'waiting' | 'learning' | 'completed';
  progressPercent: number;
  datHoursCompleted: number;
  notes?: string;
  teacher?: { id: number; username: string; phone?: string };
};

type HocVien = {
  id: number;
  HoTen: string;
  NgaySinh?: string;
  GioiTinh?: string;
  SoCCCD?: string;
  phone?: string;
  email?: string;
  DiaChi?: string;
  loaibangthi?: string;
  IDKhoaHoc?: string;
  status: 'registered' | 'assigned' | 'learning' | 'dat_completed' | 'exam_ready';
  assignment?: Assignment;
};

const HV_STATUS_LABEL: Record<string, string> = {
  registered: 'Mới đăng ký',
  assigned: 'Chờ học',
  learning: 'Đang học',
  dat_completed: 'Đủ giờ DAT',
  exam_ready: 'Sẵn sàng thi',
};

const ASSIGN_STATUS_LABEL: Record<string, string> = {
  waiting: 'Chờ phân công',
  learning: 'Đang học',
  completed: 'Hoàn thành',
};

const getInitials = (name: string) =>
  name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (raw?: string) => {
  if (!raw) return '—';
  try { return new Date(raw).toLocaleDateString('vi-VN'); } catch { return raw; }
};

const HocVienManagement: React.FC = () => {
  const { get, post, put, del } = useApiService();
  const navigate = useNavigate();

  const [hocVienList, setHocVienList] = useState<HocVien[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer
  const [drawerItem, setDrawerItem] = useState<HocVien | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState<'waiting' | 'learning' | 'completed'>('learning');
  const [editDatHours, setEditDatHours] = useState(0);
  const [progressSaving, setProgressSaving] = useState(false);

  // Assign modal
  const [assignTarget, setAssignTarget] = useState<HocVien | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoadingData(true);
    get<{ EC: number; DT: HocVien[] }>('/api/hocvien')
      .then(res => { if (res.EC === 0) setHocVienList(res.DT ?? []); })
      .finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    get<{ EC: number; DT: Teacher[] }>('/api/users')
      .then(res => { if (res.EC === 0) setTeachers(res.DT ?? []); })
      .finally(() => setLoading(false));
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = hocVienList;
    if (licenseFilter) list = list.filter(s => s.loaibangthi === licenseFilter);
    if (statusFilter) list = list.filter(s => {
      if (statusFilter === 'unassigned') return !s.assignment || s.assignment.status === 'waiting';
      return s.assignment?.status === statusFilter;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.HoTen?.toLowerCase().includes(q) ||
        s.SoCCCD?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.DiaChi?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [hocVienList, licenseFilter, statusFilter, search]);

  const openDrawer = (s: HocVien) => {
    setDrawerItem(s);
    setEditProgress(s.assignment?.progressPercent ?? 0);
    setEditStatus(s.assignment?.status ?? 'learning');
    setEditDatHours(s.assignment?.datHoursCompleted ?? 0);
  };

  const openAssign = (s: HocVien, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssignTarget(s);
    setAssignTeacherId(s.assignment?.teacherId ?? '');
    setAssignNotes(s.assignment?.notes ?? '');
  };

  const handleAssignSave = async () => {
    if (!assignTarget || !assignTeacherId) return;
    setAssignSaving(true);
    try {
      await post<{ EC: number }>('/api/student-assignment', {
        hocVienId: assignTarget.id,
        teacherId: assignTeacherId,
        courseId: null,
        notes: assignNotes || null,
      });
      await fetchData();
      setAssignTarget(null);
    } finally {
      setAssignSaving(false);
    }
  };

  const handleDelete = async (s: HocVien, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Xoá học viên "${s.HoTen}"? Thao tác này sẽ xoá cả tài khoản và dữ liệu phân công.`)) return;
    await del<{ EC: number }>(`/api/hocvien/${s.id}`);
    if (drawerItem?.id === s.id) setDrawerItem(null);
    await fetchData();
  };

  const handleProgressSave = async () => {
    if (!drawerItem?.assignment) return;
    setProgressSaving(true);
    try {
      await put<{ EC: number }>(`/api/student-assignment/${drawerItem.assignment.id}`, {
        status: editStatus,
        progressPercent: editProgress,
        datHoursCompleted: editDatHours,
      });
      await fetchData();
      setDrawerItem(prev =>
        prev ? {
          ...prev,
          assignment: prev.assignment
            ? { ...prev.assignment, status: editStatus, progressPercent: editProgress, datHoursCompleted: editDatHours }
            : prev.assignment,
        } : null,
      );
    } finally {
      setProgressSaving(false);
    }
  };

  const licenseTypes = [...new Set(hocVienList.map(s => s.loaibangthi).filter(Boolean))].sort() as string[];

  return (
    <div className={`hvm ${drawerItem ? 'hvm--drawer-open' : ''}`}>
      {/* Header */}
      <div className="hvm__header">
        <div>
          <h1 className="hvm__title">Quản lý Học viên</h1>
          <p className="hvm__subtitle">
            Theo dõi và quản lý <strong>{hocVienList.length}</strong> học viên đào tạo
          </p>
        </div>
        <button className="hvm__btn-add" onClick={() => navigate('/dashboard/dang-ky-hoc-vien')}>
          <span className="material-icons">person_add</span>
          + Thêm học viên mới
        </button>
      </div>

      {/* Filters */}
      <div className="hvm__filters">
        <div className="hvm__filter-group">
          <label className="hvm__filter-label">Trạng thái</label>
          <select className="hvm__select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="unassigned">Chưa phân công</option>
            <option value="learning">Đang học</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
        <div className="hvm__filter-group">
          <label className="hvm__filter-label">Hạng bằng</label>
          <select className="hvm__select" value={licenseFilter} onChange={e => setLicenseFilter(e.target.value)}>
            <option value="">Tất cả</option>
            {licenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="hvm__filter-group hvm__filter-group--search">
          <label className="hvm__filter-label">Tìm kiếm</label>
          <div className="hvm__search-wrap">
            <span className="material-icons hvm__search-icon">search</span>
            <input className="hvm__search" placeholder="Tên, CCCD, SĐT..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className="hvm__search-clear" onClick={() => setSearch('')}>
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading || loadingData ? (
        <div className="hvm__state"><span className="material-icons hvm__spin">sync</span>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="hvm__state">
          <span className="material-icons">person_search</span>
          {hocVienList.length === 0 ? 'Chưa có học viên nào đăng ký' : 'Không tìm thấy kết quả'}
        </div>
      ) : (
        <div className="hvm__table-wrap">
          <table className="hvm__table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Địa chỉ</th>
                <th className="hvm__th-center">Hạng</th>
                <th>Tiến độ</th>
                <th>Trạng thái</th>
                <th>Giáo viên</th>
                <th className="hvm__th-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const a = s.assignment;
                const pct = a?.progressPercent ?? 0;
                const assignStatus = a?.status ?? 'waiting';
                const teacherName = a?.teacher?.username ?? teachers.find(t => t.id === a?.teacherId)?.username;
                return (
                  <tr
                    key={s.id}
                    onClick={() => openDrawer(s)}
                    className={drawerItem?.id === s.id ? 'hvm__row--active' : ''}
                  >
                    <td>
                      <div className="hvm__student-cell">
                        <div className="hvm__avatar">{getInitials(s.HoTen)}</div>
                        <div>
                          <div className="hvm__student-name">{s.HoTen}</div>
                          <div className="hvm__student-id">
                            {s.SoCCCD ? `CCCD: ${s.SoCCCD}` : `HV-${String(s.id).padStart(4, '0')}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hvm__td-muted">{s.DiaChi || '—'}</td>
                    <td className="hvm__th-center">
                      {s.loaibangthi ? <span className="hvm__rank-badge">{s.loaibangthi}</span> : '—'}
                    </td>
                    <td>
                      <div className="hvm__progress-cell">
                        <div className="hvm__progress-labels"><span>{pct}%</span></div>
                        <div className="hvm__progress-track">
                          <div
                            className={`hvm__progress-fill ${assignStatus === 'completed' ? 'hvm__progress-fill--done' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`hvm__status-badge hvm__status-badge--${assignStatus}`}>
                        {assignStatus === 'learning' && <span className="hvm__status-dot" />}
                        {ASSIGN_STATUS_LABEL[assignStatus]}
                      </span>
                    </td>
                    <td>
                      {teacherName ? (
                        <div className="hvm__teacher-cell">
                          <div className="hvm__teacher-avatar">{getInitials(teacherName)}</div>
                          <span className="hvm__teacher-name">{teacherName}</span>
                        </div>
                      ) : (
                        <span className="hvm__not-assigned">Chưa phân công</span>
                      )}
                    </td>
                    <td>
                      <div className="hvm__row-actions">
                        <button className="hvm__btn-assign" onClick={e => openAssign(s, e)}>
                          {a ? 'Đổi GV' : 'Phân công'}
                        </button>
                        <button className="hvm__btn-delete" onClick={e => handleDelete(s, e)} title="Xoá học viên">
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="hvm__table-footer">
            Hiển thị <strong>{filtered.length}</strong> / <strong>{hocVienList.length}</strong> học viên
          </div>
        </div>
      )}

      {/* Right Drawer */}
      {drawerItem && (
        <aside className="hvm__drawer">
          <div className="hvm__drawer-header">
            <h3>Hồ sơ học viên</h3>
            <button className="hvm__drawer-close" onClick={() => setDrawerItem(null)}>
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="hvm__drawer-body">
            <div className="hvm__drawer-profile">
              <div className="hvm__drawer-avatar">{getInitials(drawerItem.HoTen)}</div>
              <h4 className="hvm__drawer-name">{drawerItem.HoTen}</h4>
              <p className="hvm__drawer-license">Hạng: <strong>{drawerItem.loaibangthi || '—'}</strong></p>
              <div className="hvm__drawer-stats">
                <div>
                  <span className="hvm__drawer-stat-label">Hồ sơ</span>
                  <span className="hvm__drawer-stat-value">{HV_STATUS_LABEL[drawerItem.status]}</span>
                </div>
                <div className="hvm__drawer-divider" />
                <div>
                  <span className="hvm__drawer-stat-label">Tiến độ</span>
                  <span className="hvm__drawer-stat-value">{drawerItem.assignment?.progressPercent ?? 0}%</span>
                </div>
                <div className="hvm__drawer-divider" />
                <div>
                  <span className="hvm__drawer-stat-label">Giờ DAT</span>
                  <span className="hvm__drawer-stat-value">{drawerItem.assignment?.datHoursCompleted ?? 0}h</span>
                </div>
              </div>
            </div>

            <div className="hvm__drawer-section">
              <h5 className="hvm__drawer-section-title">Thông tin cá nhân</h5>
              <div className="hvm__drawer-info-grid">
                {[
                  ['CCCD / CMND', drawerItem.SoCCCD],
                  ['Ngày sinh', formatDate(drawerItem.NgaySinh)],
                  ['Giới tính', drawerItem.GioiTinh],
                  ['Số điện thoại', drawerItem.phone],
                  ['Email', drawerItem.email],
                  ['Địa chỉ', drawerItem.DiaChi],
                ].map(([label, value]) => (
                  <div key={label} className="hvm__drawer-info-item">
                    <span className="hvm__drawer-info-label">{label}</span>
                    <span className="hvm__drawer-info-value">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hvm__drawer-section">
              <h5 className="hvm__drawer-section-title">Giáo viên phụ trách</h5>
              {drawerItem.assignment ? (() => {
                const tName = drawerItem.assignment.teacher?.username
                  ?? teachers.find(t => t.id === drawerItem.assignment?.teacherId)?.username ?? '—';
                return (
                  <div className="hvm__drawer-teacher">
                    <div className="hvm__teacher-avatar hvm__teacher-avatar--lg">{getInitials(tName)}</div>
                    <div>
                      <div className="hvm__drawer-teacher-name">{tName}</div>
                      {drawerItem.assignment.notes && (
                        <div className="hvm__drawer-teacher-notes">{drawerItem.assignment.notes}</div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <p className="hvm__not-assigned">Chưa được phân công giáo viên</p>
              )}
            </div>

            {drawerItem.assignment && (
              <div className="hvm__drawer-section">
                <h5 className="hvm__drawer-section-title">Cập nhật tiến độ</h5>
                <div className="hvm__progress-edit">
                  <label className="hvm__edit-label">
                    Trạng thái
                    <select className="hvm__edit-select" value={editStatus}
                      onChange={e => setEditStatus(e.target.value as typeof editStatus)}>
                      <option value="waiting">Chờ phân công</option>
                      <option value="learning">Đang học</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </label>
                  <label className="hvm__edit-label">
                    Tiến độ: <strong>{editProgress}%</strong>
                    <input type="range" min={0} max={100} value={editProgress}
                      onChange={e => setEditProgress(+e.target.value)} className="hvm__progress-slider" />
                  </label>
                  <label className="hvm__edit-label">
                    Giờ DAT thực hành: <strong>{editDatHours}h</strong>
                    <input type="number" min={0} step={0.5} value={editDatHours}
                      onChange={e => setEditDatHours(+e.target.value)} className="hvm__edit-input" />
                  </label>
                  <button className="hvm__btn-save-progress" onClick={handleProgressSave} disabled={progressSaving}>
                    {progressSaving
                      ? <><span className="material-icons hvm__spin">sync</span>Đang lưu...</>
                      : <><span className="material-icons">save</span>Lưu tiến độ</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hvm__drawer-footer">
            <button className="hvm__btn-assign-big" onClick={e => openAssign(drawerItem, e)}>
              <span className="material-icons">assignment_turned_in</span>
              {drawerItem.assignment ? 'Đổi giáo viên' : 'Phân công giáo viên'}
            </button>
          </div>
        </aside>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div className="hvm__overlay" onClick={() => setAssignTarget(null)}>
          <div className="hvm__modal" onClick={e => e.stopPropagation()}>
            <div className="hvm__modal-header">
              <div>
                <h3>Phân công giáo viên</h3>
                <p className="hvm__modal-subtitle">Học viên: <strong>{assignTarget.HoTen}</strong></p>
              </div>
              <button className="hvm__modal-close" onClick={() => setAssignTarget(null)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="hvm__modal-body">
              <label className="hvm__edit-label">
                Chọn giáo viên
                <select className="hvm__edit-select" value={assignTeacherId}
                  onChange={e => setAssignTeacherId(+e.target.value)}>
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.username} ({t.email})</option>
                  ))}
                </select>
              </label>
              <label className="hvm__edit-label">
                Ghi chú
                <textarea className="hvm__edit-textarea" value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  placeholder="Ghi chú về việc phân công..." rows={3} />
              </label>
            </div>
            <div className="hvm__modal-footer">
              <button className="hvm__btn-ghost" onClick={() => setAssignTarget(null)}>Huỷ</button>
              <button className="hvm__btn-primary" onClick={handleAssignSave}
                disabled={assignSaving || !assignTeacherId}>
                {assignSaving
                  ? <><span className="material-icons hvm__spin">sync</span>Đang lưu...</>
                  : <><span className="material-icons">assignment_turned_in</span>Xác nhận</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HocVienManagement;
