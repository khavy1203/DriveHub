import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useApiService from '../../../services/useApiService';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import './ManualAssign.scss';

type Teacher = { id: number; username: string; email: string };

type Assignment = {
  id: number;
  hocVienId: number;
  teacherId: number;
  status: 'waiting' | 'learning' | 'completed';
  progressPercent: number;
  datHoursCompleted?: number;
  notes?: string;
  teacher?: { id: number; username: string };
};

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
  status?: string;
  assignment?: Assignment;
};

const STATUS_LABEL: Record<string, string> = {
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

const canEditAssignmentProgressRole = (role: string | null): boolean =>
  role === 'Admin' || role === 'SupperAdmin';

const ManualAssign: React.FC = () => {
  const { get, post, put } = useApiService();
  const { role } = useAuth();
  const canEditProgress = canEditAssignmentProgressRole(role);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<HocVien[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [drawerStudent, setDrawerStudent] = useState<HocVien | null>(null);
  const [editStatus, setEditStatus] = useState<'waiting' | 'learning' | 'completed'>('learning');
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editDatHours, setEditDatHours] = useState<number>(0);
  const [progressSaving, setProgressSaving] = useState(false);

  const [targetTeacherId, setTargetTeacherId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const [filterStatus, setFilterStatus] = useState<'' | 'unassigned' | 'waiting' | 'learning' | 'completed'>('unassigned');
  const [search, setSearch] = useState('');

  type SortKey = 'name' | 'address' | 'progress';
  type SortDir = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const fetchStudents = useCallback(() => {
    setLoadingStudents(true);
    setSelected(new Set());
    setSuccessCount(null);
    get<{ EC: number; DT: HocVien[] }>('/api/hocvien')
      .then(res => { if (res.EC === 0) setStudents(res.DT ?? []); })
      .finally(() => setLoadingStudents(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    get<{ EC: number; DT: Teacher[] }>('/api/users')
      .then(res => { if (res.EC === 0) setTeachers(res.DT ?? []); })
      .finally(() => setLoadingInit(false));
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = students;
    if (filterStatus === 'unassigned') {
      list = list.filter(s => !s.assignment || s.assignment.status === 'waiting');
    } else if (filterStatus) {
      list = list.filter(s => s.assignment?.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.HoTen?.toLowerCase().includes(q) ||
        s.SoCCCD?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q),
      );
    }
    if (sortKey) {
      const dir = sortDir === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        if (sortKey === 'name')
          return dir * (a.HoTen ?? '').localeCompare(b.HoTen ?? '', 'vi');
        if (sortKey === 'address')
          return dir * (a.DiaChi ?? '').localeCompare(b.DiaChi ?? '', 'vi');
        if (sortKey === 'progress')
          return dir * ((a.assignment?.progressPercent ?? 0) - (b.assignment?.progressPercent ?? 0));
        return 0;
      });
    }
    return list;
  }, [students, filterStatus, search, sortKey, sortDir]);

  const unassignedCount = useMemo(
    () => students.filter(s => !s.assignment || s.assignment.status === 'waiting').length,
    [students],
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const toggleOne = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openDrawer = (s: HocVien) => {
    setDrawerStudent(s);
    setEditProgress(s.assignment?.progressPercent ?? 0);
    setEditDatHours(s.assignment?.datHoursCompleted ?? 0);
    setEditStatus(s.assignment?.status ?? 'learning');
  };

  const handleProgressSave = async () => {
    if (!drawerStudent?.assignment || !canEditProgress) return;
    setProgressSaving(true);
    try {
      await put<{ EC: number }>(`/api/student-assignment/${drawerStudent.assignment.id}`, {
        status: editStatus,
        progressPercent: editProgress,
        datHoursCompleted: editDatHours,
      });
      await fetchStudents();
      setDrawerStudent(prev =>
        prev
          ? {
              ...prev,
              assignment: prev.assignment
                ? { ...prev.assignment, status: editStatus, progressPercent: editProgress, datHoursCompleted: editDatHours }
                : prev.assignment,
            }
          : null,
      );
    } finally {
      setProgressSaving(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!targetTeacherId || selected.size === 0) return;
    setSaving(true);
    setSuccessCount(null);
    try {
      const ids = [...selected];
      await Promise.all(
        ids.map(hocVienId =>
          post<{ EC: number }>('/api/student-assignment', {
            hocVienId,
            teacherId: targetTeacherId,
            courseId: null,
          }),
        ),
      );
      setSuccessCount(ids.length);
      setSelected(new Set());
      await fetchStudents();
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="ma">
        <div className="ma__state">
          <span className="material-icons ma__spin">sync</span>Đang tải...
        </div>
      </div>
    );
  }

  const drawerTeacherName =
    drawerStudent?.assignment?.teacher?.username ??
    teachers.find(t => t.id === drawerStudent?.assignment?.teacherId)?.username;

  return (
    <div className={`ma ${drawerStudent ? 'ma--drawer-open' : ''}`}>
      <div className="ma__header">
        <div>
          <h1 className="ma__title">Phân công học viên</h1>
          <p className="ma__subtitle">
            Phân công giáo viên và theo dõi tiến độ đào tạo —{' '}
            <strong>{unassignedCount}</strong> học viên chưa được phân công
          </p>
        </div>
      </div>

      <div className="ma__toolbar">
        <div className="ma__toolbar-filters">
          <div className="ma__field">
            <label className="ma__label">Trạng thái</label>
            <select
              className="ma__select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="unassigned">Chưa phân công</option>
              <option value="">Tất cả</option>
              <option value="learning">Đang học</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>

          <div className="ma__field ma__field--search">
            <label className="ma__label">Tìm kiếm</label>
            <div className="ma__search-wrap">
              <span className="material-icons ma__search-icon">search</span>
              <input
                className="ma__search"
                placeholder="Tên, CCCD, số điện thoại..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="ma__search-clear" onClick={() => setSearch('')}>
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`ma__assign-bar ${selected.size > 0 ? 'ma__assign-bar--visible' : ''}`}>
          <span className="ma__assign-count">
            <span className="material-icons">check_circle</span>
            Đã chọn <strong>{selected.size}</strong> học viên
          </span>
          <select
            className="ma__select ma__select--teacher"
            value={targetTeacherId}
            onChange={e => setTargetTeacherId(+e.target.value)}
          >
            <option value="">-- Chọn giáo viên --</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.username}</option>
            ))}
          </select>
          <button
            className="ma__btn-assign"
            onClick={handleBulkAssign}
            disabled={saving || !targetTeacherId}
          >
            {saving
              ? <><span className="material-icons ma__spin">sync</span>Đang lưu...</>
              : <><span className="material-icons">assignment_turned_in</span>Phân công ngay</>
            }
          </button>
          <button className="ma__btn-ghost" onClick={() => setSelected(new Set())}>Huỷ</button>
        </div>
      </div>

      {successCount !== null && (
        <div className="ma__success-banner">
          <span className="material-icons">check_circle</span>
          Đã phân công thành công <strong>{successCount}</strong> học viên
        </div>
      )}

      {loadingStudents ? (
        <div className="ma__state">
          <span className="material-icons ma__spin">sync</span>Đang tải...
        </div>
      ) : filtered.length === 0 ? (
        <div className="ma__state">
          <span className="material-icons">assignment_ind</span>
          {students.length === 0
            ? 'Chưa có học viên nào đăng ký'
            : 'Không tìm thấy học viên phù hợp'}
        </div>
      ) : (
        <div className="ma__table-wrap">
          <table className="ma__table">
            <thead>
              <tr>
                <th className="ma__th-check">
                  <input
                    type="checkbox"
                    className="ma__checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                  />
                </th>
                <th>
                  <button className={`ma__sort-btn ${sortKey === 'name' ? 'ma__sort-btn--active' : ''}`} onClick={() => handleSort('name')}>
                    Học viên
                    <span className="material-icons ma__sort-icon">
                      {sortKey === 'name' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </button>
                </th>
                <th>
                  <button className={`ma__sort-btn ${sortKey === 'address' ? 'ma__sort-btn--active' : ''}`} onClick={() => handleSort('address')}>
                    Địa chỉ
                    <span className="material-icons ma__sort-icon">
                      {sortKey === 'address' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </button>
                </th>
                <th className="ma__th-center">Hạng</th>
                <th>
                  <button className={`ma__sort-btn ${sortKey === 'progress' ? 'ma__sort-btn--active' : ''}`} onClick={() => handleSort('progress')}>
                    Tiến độ
                    <span className="material-icons ma__sort-icon">
                      {sortKey === 'progress' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </button>
                </th>
                <th>Trạng thái</th>
                <th>Giáo viên phụ trách</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const a = s.assignment;
                const status = a?.status ?? 'waiting';
                const pct = a?.progressPercent ?? 0;
                const teacherName =
                  a?.teacher?.username ??
                  teachers.find(t => t.id === a?.teacherId)?.username;
                const isChecked = selected.has(s.id);
                const isActive = drawerStudent?.id === s.id;
                return (
                  <tr
                    key={s.id}
                    className={[
                      isChecked ? 'ma__row--selected' : '',
                      isActive ? 'ma__row--active' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => openDrawer(s)}
                  >
                    <td className="ma__td-check" onClick={e => toggleOne(s.id, e)}>
                      <input
                        type="checkbox"
                        className="ma__checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                      />
                    </td>
                    <td>
                      <div className="ma__student-cell">
                        <div className="ma__avatar">{getInitials(s.HoTen)}</div>
                        <div>
                          <div className="ma__student-name">{s.HoTen}</div>
                          <div className="ma__student-id">
                            {s.SoCCCD ? `CCCD: ${s.SoCCCD}` : `HV-${String(s.id).padStart(4, '0')}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="ma__td-muted">{s.DiaChi || '—'}</td>
                    <td className="ma__th-center">
                      {s.loaibangthi
                        ? <span className="ma__rank-badge">{s.loaibangthi}</span>
                        : '—'}
                    </td>
                    <td>
                      <div className="ma__progress-cell">
                        <span className="ma__progress-pct">{pct}%</span>
                        <div className="ma__progress-track">
                          <div
                            className={`ma__progress-fill ${status === 'completed' ? 'ma__progress-fill--done' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ma__status-badge ma__status-badge--${status}`}>
                        {status === 'learning' && <span className="ma__status-dot" />}
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td>
                      {teacherName ? (
                        <div className="ma__teacher-cell">
                          <div className="ma__teacher-avatar">{getInitials(teacherName)}</div>
                          <span>{teacherName}</span>
                        </div>
                      ) : (
                        <span className="ma__not-assigned">Chưa phân công</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="ma__table-footer">
            Hiển thị <strong>{filtered.length}</strong> / <strong>{students.length}</strong> học viên
            {selected.size > 0 && (
              <span className="ma__footer-selected"> · Đã chọn <strong>{selected.size}</strong></span>
            )}
          </div>
        </div>
      )}

      {drawerStudent && (
        <aside className="ma__drawer">
          <div className="ma__drawer-header">
            <h3>Chi tiết học viên</h3>
            <button className="ma__drawer-close" onClick={() => setDrawerStudent(null)}>
              <span className="material-icons">close</span>
            </button>
          </div>

          <div className="ma__drawer-body">
            <div className="ma__drawer-profile">
              <div className="ma__drawer-avatar">{getInitials(drawerStudent.HoTen)}</div>
              <h4 className="ma__drawer-name">{drawerStudent.HoTen}</h4>
              <p className="ma__drawer-license">
                Hạng: <strong>{drawerStudent.loaibangthi || '—'}</strong>
              </p>
            </div>

            <div className="ma__drawer-progress-card">
              <div className="ma__drawer-progress-top">
                <span className={`ma__status-badge ma__status-badge--${drawerStudent.assignment?.status ?? 'waiting'}`}>
                  {drawerStudent.assignment?.status === 'learning' && <span className="ma__status-dot" />}
                  {STATUS_LABEL[drawerStudent.assignment?.status ?? 'waiting']}
                </span>
                <span className="ma__drawer-pct-label">
                  {drawerStudent.assignment?.progressPercent ?? 0}%
                </span>
              </div>
              <div className="ma__drawer-progress-track">
                <div
                  className={`ma__drawer-progress-fill ${drawerStudent.assignment?.status === 'completed' ? 'ma__drawer-progress-fill--done' : ''}`}
                  style={{ width: `${drawerStudent.assignment?.progressPercent ?? 0}%` }}
                />
              </div>
              <p className="ma__drawer-progress-hint">
                Tiến độ đào tạo · DAT: <strong>{drawerStudent.assignment?.datHoursCompleted ?? 0}h</strong>
              </p>
            </div>

            <div className="ma__drawer-section">
              <h5 className="ma__drawer-section-title">Thông tin cá nhân</h5>
              <div className="ma__drawer-info-grid">
                <div className="ma__drawer-info-item">
                  <span className="ma__drawer-info-label">CCCD</span>
                  <span className="ma__drawer-info-value">{drawerStudent.SoCCCD || '—'}</span>
                </div>
                <div className="ma__drawer-info-item">
                  <span className="ma__drawer-info-label">Ngày sinh</span>
                  <span className="ma__drawer-info-value">{formatDate(drawerStudent.NgaySinh)}</span>
                </div>
                <div className="ma__drawer-info-item">
                  <span className="ma__drawer-info-label">Giới tính</span>
                  <span className="ma__drawer-info-value">{drawerStudent.GioiTinh || '—'}</span>
                </div>
                <div className="ma__drawer-info-item">
                  <span className="ma__drawer-info-label">Địa chỉ</span>
                  <span className="ma__drawer-info-value">{drawerStudent.DiaChi || '—'}</span>
                </div>
              </div>
            </div>

            <div className="ma__drawer-section">
              <h5 className="ma__drawer-section-title">Giáo viên phụ trách</h5>
              {drawerTeacherName ? (
                <div className="ma__drawer-teacher">
                  <div className="ma__drawer-teacher-avatar">{getInitials(drawerTeacherName)}</div>
                  <div>
                    <div className="ma__drawer-teacher-name">{drawerTeacherName}</div>
                    {drawerStudent.assignment?.notes && (
                      <div className="ma__drawer-teacher-notes">{drawerStudent.assignment.notes}</div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="ma__not-assigned">Chưa được phân công giáo viên</p>
              )}
            </div>

            {drawerStudent.assignment && canEditProgress ? (
              <div className="ma__drawer-section">
                <h5 className="ma__drawer-section-title">Cập nhật tiến độ</h5>
                <div className="ma__progress-edit">
                  <label className="ma__edit-label">
                    Trạng thái
                    <select
                      className="ma__edit-select"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as typeof editStatus)}
                    >
                      <option value="waiting">Chờ phân công</option>
                      <option value="learning">Đang học</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </label>
                  <label className="ma__edit-label">
                    Tiến độ: <strong>{editProgress}%</strong>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={editProgress}
                      onChange={e => setEditProgress(+e.target.value)}
                      className="ma__progress-slider"
                    />
                  </label>
                  <label className="ma__edit-label">
                    Giờ DAT thực hành: <strong>{editDatHours}h</strong>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={editDatHours}
                      onChange={e => setEditDatHours(+e.target.value)}
                      className="ma__edit-input"
                    />
                  </label>
                  <button
                    type="button"
                    className="ma__btn-save-progress"
                    onClick={handleProgressSave}
                    disabled={progressSaving}
                  >
                    {progressSaving
                      ? <><span className="material-icons ma__spin">sync</span>Đang lưu...</>
                      : <><span className="material-icons">save</span>Lưu tiến độ</>
                    }
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      )}
    </div>
  );
};

export default ManualAssign;
