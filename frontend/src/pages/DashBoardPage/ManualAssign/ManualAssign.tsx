import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import useApiService from '../../../services/useApiService';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import {
  buildClassGroups,
  extractDistrictLine,
  sortStudentsInGroup,
  type KhoaHocBrief,
} from '../../../shared/studentClassGrouping';
import './ManualAssign.scss';

type Teacher = { id: number; username: string; email: string; address?: string | null };

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
  IDKhoaHoc?: string | null;
  khoahoc?: KhoaHocBrief | null;
  createdAt?: string;
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
  try {
    return new Date(raw).toLocaleDateString('vi-VN');
  } catch {
    return raw;
  }
};

const canEditAssignmentProgressRole = (role: string | null): boolean =>
  role === 'Admin' || role === 'SupperAdmin';

const teacherMatchScore = (teacher: Teacher, selected: HocVien[]): number => {
  const addr = (teacher.address ?? '').toLowerCase();
  if (!addr) return 68;
  let pts = 0;
  for (const s of selected) {
    const dist = extractDistrictLine(s.DiaChi).toLowerCase();
    if (!dist || dist === '—') continue;
    if (addr.includes(dist)) {
      pts++;
      continue;
    }
    const words = dist.split(/\s+/).filter(w => w.length > 2);
    if (words.some(w => addr.includes(w))) pts++;
  }
  if (selected.length === 0) return 70;
  return Math.min(99, Math.round(52 + (pts / selected.length) * 47));
};

const ManualAssign: React.FC = () => {
  const { get, post, put } = useApiService();
  const { role } = useAuth();
  const canEditProgress = canEditAssignmentProgressRole(role);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<HocVien[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const [drawerStudent, setDrawerStudent] = useState<HocVien | null>(null);
  const [editStatus, setEditStatus] = useState<'waiting' | 'learning' | 'completed'>('learning');
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editDatHours, setEditDatHours] = useState<number>(0);
  const [progressSaving, setProgressSaving] = useState(false);

  const [targetTeacherId, setTargetTeacherId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'' | 'pending_assign' | 'learning'>('pending_assign');
  const [search, setSearch] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterClassKey, setFilterClassKey] = useState('');

  type SortKey = 'name' | 'district';
  type SortDir = 'asc' | 'desc';
  const [groupSortKey, setGroupSortKey] = useState<SortKey>('name');
  const [groupSortDir, setGroupSortDir] = useState<SortDir>('asc');

  const toggleGroupSort = (key: SortKey) => {
    if (groupSortKey === key) {
      setGroupSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setGroupSortKey(key);
      setGroupSortDir('asc');
    }
  };

  const fetchStudents = useCallback(() => {
    setLoadingStudents(true);
    setSelected(new Set());
    get<{ EC: number; DT: HocVien[] }>('/api/hocvien')
      .then(res => {
        if (res.EC === 0) setStudents(res.DT ?? []);
      })
      .finally(() => setLoadingStudents(false));
  }, [get]);

  useEffect(() => {
    get<{ EC: number; DT: Teacher[] }>('/api/users')
      .then(res => {
        if (res.EC === 0) setTeachers(res.DT ?? []);
      })
      .finally(() => setLoadingInit(false));
    fetchStudents();
  }, [fetchStudents, get]);

  const unassignedCount = useMemo(
    () => students.filter(s => !s.assignment || s.assignment.status === 'waiting').length,
    [students],
  );

  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      const d = extractDistrictLine(s.DiaChi);
      if (d && d !== '—') set.add(d);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [students]);

  const classFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      const id = s.khoahoc?.IDKhoaHoc ?? s.IDKhoaHoc ?? '';
      const key = id || '__no_class__';
      const label =
        key === '__no_class__'
          ? 'Chưa xếp lớp'
          : (s.khoahoc?.TenKhoaHoc?.trim() || s.khoahoc?.IDKhoaHoc || s.IDKhoaHoc || 'Lớp');
      if (!map.has(key)) map.set(key, label);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  }, [students]);

  const pipelineFiltered = useMemo(() => {
    let list = students;

    if (filterStatus === 'pending_assign') {
      list = list.filter(s => !s.assignment || s.assignment.status === 'waiting');
    } else if (filterStatus === 'learning') {
      list = list.filter(s => s.assignment?.status === 'learning');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        s =>
          s.HoTen?.toLowerCase().includes(q) ||
          s.SoCCCD?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q),
      );
    }

    if (filterDistrict) {
      list = list.filter(s => extractDistrictLine(s.DiaChi) === filterDistrict);
    }

    if (filterClassKey) {
      list = list.filter(s => {
        const id = s.khoahoc?.IDKhoaHoc ?? s.IDKhoaHoc ?? '';
        const key = id || '__no_class__';
        return key === filterClassKey;
      });
    }

    return list;
  }, [students, filterStatus, search, filterDistrict, filterClassKey]);

  const groups = useMemo(() => {
    const raw = buildClassGroups(pipelineFiltered, s => s.createdAt);
    return raw.map(g => ({
      ...g,
      students: sortStudentsInGroup(g.students, groupSortKey, groupSortDir),
    }));
  }, [pipelineFiltered, groupSortKey, groupSortDir]);

  const selectedStudents = useMemo(
    () => students.filter(s => selected.has(s.id)),
    [students, selected],
  );

  const teacherSuggestions = useMemo(() => {
    if (selectedStudents.length === 0) return [];
    const scored = teachers.map(t => ({
      teacher: t,
      score: teacherMatchScore(t, selectedStudents),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6);
  }, [teachers, selectedStudents]);

  const toggleGroupCollapsed = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectGroup = (groupStudentIds: number[]) => {
    const allSelected = groupStudentIds.length > 0 && groupStudentIds.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        groupStudentIds.forEach(id => next.delete(id));
      } else {
        groupStudentIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
                ? {
                    ...prev.assignment,
                    status: editStatus,
                    progressPercent: editProgress,
                    datHoursCompleted: editDatHours,
                  }
                : prev.assignment,
            }
          : null,
      );
      toast.success('Đã cập nhật tiến độ.');
    } finally {
      setProgressSaving(false);
    }
  };

  const runBulkAssign = async () => {
    if (!targetTeacherId || selected.size === 0) return;
    setSaving(true);
    try {
      const ids = [...selected];
      const results = await Promise.all(
        ids.map(hocVienId =>
          post<{ EC: number; EM?: string }>('/api/student-assignment', {
            hocVienId,
            teacherId: targetTeacherId,
            courseId: null,
          }),
        ),
      );
      const failed = results.filter(r => r.EC !== 0);
      if (failed.length > 0) {
        toast.error(failed[0]?.EM || `Có ${failed.length} lượt phân công thất bại.`);
        return;
      }
      setSelected(new Set());
      setConfirmOpen(false);
      await fetchStudents();
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 2800);
      toast.success(`Đã phân công thành công ${ids.length} học viên.`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="assign-page">
        <div className="assign-page__state">
          <span className="material-icons assign-page__spin">sync</span>
          Đang tải...
        </div>
      </div>
    );
  }

  const drawerTeacherName =
    drawerStudent?.assignment?.teacher?.username ??
    teachers.find(t => t.id === drawerStudent?.assignment?.teacherId)?.username;

  const selectedTeacher = teachers.find(t => t.id === targetTeacherId);

  return (
    <div className={`assign-page ${drawerStudent ? 'assign-page--drawer-open' : ''}`}>
      {confetti && (
        <div className="assign-page__confetti" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="assign-page__confetti-bit" />
          ))}
        </div>
      )}

      <div className="assign-page__top">
        <div>
          <h1 className="assign-page__title">Quản lý phân công</h1>
          <p className="assign-page__lead">
            Assign thủ công hàng loạt — <strong>{unassignedCount}</strong> học viên đang chờ phân công
          </p>
        </div>
        <div className="assign-page__badge-info">
          <span className="material-icons">groups</span>
          Tổng {students.length} học viên
        </div>
      </div>

      <div className="assign-page__layout">
        <div className="assign-page__main">
          <div className="assign-page__filters">
            <div className="assign-page__field assign-page__field--grow">
              <label className="assign-page__label">Tìm kiếm</label>
              <div className="assign-page__search">
                <span className="material-icons assign-page__search-icon">search</span>
                <input
                  type="search"
                  className="assign-page__input"
                  placeholder="Tên, CCCD, số điện thoại..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="assign-page__field">
              <label className="assign-page__label">Huyện / khu vực</label>
              <select
                className="assign-page__select"
                value={filterDistrict}
                onChange={e => setFilterDistrict(e.target.value)}
              >
                <option value="">Tất cả huyện</option>
                {districtOptions.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="assign-page__field">
              <label className="assign-page__label">Trạng thái</label>
              <select
                className="assign-page__select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              >
                <option value="">Tất cả</option>
                <option value="pending_assign">Chờ assign</option>
                <option value="learning">Đang học</option>
              </select>
            </div>
            <div className="assign-page__field">
              <label className="assign-page__label">Nhóm lớp</label>
              <select
                className="assign-page__select"
                value={filterClassKey}
                onChange={e => setFilterClassKey(e.target.value)}
              >
                <option value="">Tất cả lớp</option>
                {classFilterOptions.map(([val, lab]) => (
                  <option key={val} value={val}>
                    {lab}
                  </option>
                ))}
              </select>
            </div>
            <div className="assign-page__field assign-page__field--sort">
              <label className="assign-page__label">Sắp xếp trong lớp</label>
              <div className="assign-page__sort-btns">
                <button
                  type="button"
                  className={`assign-page__chip ${groupSortKey === 'name' ? 'assign-page__chip--on' : ''}`}
                  onClick={() => toggleGroupSort('name')}
                >
                  Tên {groupSortKey === 'name' ? (groupSortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
                <button
                  type="button"
                  className={`assign-page__chip ${groupSortKey === 'district' ? 'assign-page__chip--on' : ''}`}
                  onClick={() => toggleGroupSort('district')}
                >
                  Huyện {groupSortKey === 'district' ? (groupSortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="assign-page__selection-bar">
              <span className="assign-page__selection-pill">
                Đã chọn <strong>{selected.size}</strong> học viên
              </span>
              <button type="button" className="assign-page__link-btn" onClick={() => setSelected(new Set())}>
                Bỏ chọn tất cả
              </button>
            </div>
          )}

          {loadingStudents ? (
            <div className="assign-page__state">
              <span className="material-icons assign-page__spin">sync</span>
              Đang tải danh sách...
            </div>
          ) : groups.length === 0 ? (
            <div className="assign-page__state">
              <span className="material-icons">person_search</span>
              {students.length === 0
                ? 'Chưa có học viên nào đăng ký'
                : 'Không có học viên khớp bộ lọc'}
            </div>
          ) : (
            <div className="assign-page__groups">
              {groups.map(group => {
                const isCollapsed = collapsedGroups.has(group.key);
                const ids = group.students.map(s => s.id);
                const allInGroup = ids.length > 0 && ids.every(id => selected.has(id));
                const classLabel =
                  group.key === '__no_class__'
                    ? group.title
                    : `${group.title}${group.subtitle ? ` — ${group.subtitle}` : ''}`;
                return (
                  <section key={group.key} className="assign-page__group">
                    <button
                      type="button"
                      className="assign-page__group-head"
                      onClick={() => toggleGroupCollapsed(group.key)}
                      aria-expanded={!isCollapsed}
                    >
                      <span className="assign-page__group-chev material-icons">
                        {isCollapsed ? 'expand_more' : 'expand_less'}
                      </span>
                      <div className="assign-page__group-titles">
                        <h2 className="assign-page__group-title">Lớp {classLabel}</h2>
                        <p className="assign-page__group-meta">
                          {group.students.length} học viên · Lớp mới nhất ưu tiên trên cùng
                        </p>
                      </div>
                      <button
                        type="button"
                        className="assign-page__select-all"
                        onClick={e => {
                          e.stopPropagation();
                          toggleSelectGroup(ids);
                        }}
                      >
                        {allInGroup ? 'Bỏ chọn nhóm' : 'Chọn tất cả'}
                      </button>
                    </button>
                    {!isCollapsed && (
                      <div className="assign-page__cards">
                        {group.students.map(s => {
                          const a = s.assignment;
                          const status = a?.status ?? 'waiting';
                          const pct = a?.progressPercent ?? 0;
                          const isSel = selected.has(s.id);
                          const classNameShort =
                            s.khoahoc?.TenKhoaHoc?.trim() || s.khoahoc?.IDKhoaHoc || s.IDKhoaHoc || '—';
                          return (
                            <article
                              key={s.id}
                              className={`assign-page__card ${isSel ? 'assign-page__card--selected' : ''}`}
                              onClick={() => openDrawer(s)}
                            >
                              <label className="assign-page__check-wrap" onClick={e => toggleOne(s.id, e)}>
                                <input
                                  type="checkbox"
                                  className="assign-page__checkbox"
                                  checked={isSel}
                                  onChange={() => {}}
                                />
                              </label>
                              <div className="assign-page__card-body">
                                <div className="assign-page__card-top">
                                  <div className="assign-page__avatar">{getInitials(s.HoTen)}</div>
                                  <div>
                                    <div className="assign-page__name">{s.HoTen}</div>
                                    <div className="assign-page__sub">
                                      <span className="assign-page__pill assign-page__pill--muted">
                                        {extractDistrictLine(s.DiaChi)}
                                      </span>
                                      <span className="assign-page__pill assign-page__pill--blue">
                                        {classNameShort}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="assign-page__card-grid">
                                  <div>
                                    <span className="assign-page__k">Đăng ký</span>
                                    <span className="assign-page__v">{formatDate(s.createdAt)}</span>
                                  </div>
                                  <div>
                                    <span className="assign-page__k">Tiến độ DAT</span>
                                    <span className="assign-page__v assign-page__v--progress">{pct}%</span>
                                  </div>
                                  <div>
                                    <span className="assign-page__k">Trạng thái</span>
                                    <span className={`assign-page__status assign-page__status--${status}`}>
                                      {STATUS_LABEL[status]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <p className="assign-page__footer-meta">
            Hiển thị <strong>{pipelineFiltered.length}</strong> / {students.length} học viên sau lọc
          </p>
        </div>

        <aside className={`assign-page__panel ${selected.size > 0 ? 'assign-page__panel--active' : ''}`}>
          <div className="assign-page__panel-inner">
            <h3 className="assign-page__panel-title">Gợi ý giáo viên</h3>
            <p className="assign-page__panel-desc">
              Chọn học viên bên trái để xem điểm phù hợp (match score) theo khu vực.
            </p>

            {selected.size === 0 ? (
              <div className="assign-page__panel-empty">
                <span className="material-icons">touch_app</span>
                Tick chọn một hoặc nhiều học viên để bắt đầu assign nhanh.
              </div>
            ) : (
              <>
                <div className="assign-page__panel-count">
                  Đã chọn <strong>{selected.size}</strong> học viên
                </div>
                <ul className="assign-page__suggestions">
                  {teacherSuggestions.map(({ teacher: t, score }) => {
                    const on = targetTeacherId === t.id;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          className={`assign-page__suggest ${on ? 'assign-page__suggest--on' : ''}`}
                          onClick={() => setTargetTeacherId(t.id)}
                        >
                          <span className="assign-page__suggest-avatar">{getInitials(t.username)}</span>
                          <span className="assign-page__suggest-name">{t.username}</span>
                          <span className="assign-page__suggest-score">Match {score}%</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="assign-page__panel-divider" />

                <label className="assign-page__label">Hoặc chọn giáo viên</label>
                <select
                  className="assign-page__select assign-page__select--block"
                  value={targetTeacherId}
                  onChange={e => setTargetTeacherId(e.target.value ? +e.target.value : '')}
                >
                  <option value="">— Chọn giáo viên —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.username}
                    </option>
                  ))}
                </select>

                {selectedTeacher && (
                  <p className="assign-page__teacher-pick">
                    Giáo viên được chọn: <strong>{selectedTeacher.username}</strong>
                  </p>
                )}

                <button
                  type="button"
                  className="assign-page__assign-cta"
                  disabled={saving || !targetTeacherId || selected.size === 0}
                  onClick={() => setConfirmOpen(true)}
                >
                  Assign {selected.size} học viên cho giáo viên này
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {confirmOpen && (
        <div className="assign-page__modal-backdrop" role="presentation" onClick={() => setConfirmOpen(false)}>
          <div
            className="assign-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-confirm-title"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="assign-confirm-title" className="assign-page__modal-title">
              Xác nhận phân công
            </h2>
            <p className="assign-page__modal-text">
              Bạn sắp phân công <strong>{selected.size}</strong> học viên cho{' '}
              <strong>{selectedTeacher?.username ?? 'giáo viên'}</strong>. Tiếp tục?
            </p>
            <div className="assign-page__modal-actions">
              <button type="button" className="assign-page__btn-secondary" onClick={() => setConfirmOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="assign-page__btn-primary"
                disabled={saving}
                onClick={runBulkAssign}
              >
                {saving ? 'Đang xử lý...' : 'Xác nhận Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerStudent && (
        <aside className="assign-page__drawer">
          <div className="assign-page__drawer-head">
            <h3>Chi tiết học viên</h3>
            <button type="button" className="assign-page__drawer-close" onClick={() => setDrawerStudent(null)}>
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="assign-page__drawer-body">
            <div className="assign-page__drawer-profile">
              <div className="assign-page__drawer-avatar">{getInitials(drawerStudent.HoTen)}</div>
              <h4>{drawerStudent.HoTen}</h4>
              <p>
                Hạng: <strong>{drawerStudent.loaibangthi || '—'}</strong>
              </p>
            </div>
            <div className="assign-page__drawer-section">
              <h5>Thông tin</h5>
              <p>CCCD: {drawerStudent.SoCCCD || '—'}</p>
              <p>Địa chỉ: {drawerStudent.DiaChi || '—'}</p>
              <p>Ngày sinh: {formatDate(drawerStudent.NgaySinh)}</p>
            </div>
            <div className="assign-page__drawer-section">
              <h5>Giáo viên phụ trách</h5>
              {drawerTeacherName ? <p>{drawerTeacherName}</p> : <p>Chưa phân công</p>}
            </div>
            {drawerStudent.assignment && canEditProgress ? (
              <div className="assign-page__drawer-section">
                <h5>Cập nhật tiến độ</h5>
                <label className="assign-page__edit-row">
                  Trạng thái
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as typeof editStatus)}
                  >
                    <option value="waiting">Chờ phân công</option>
                    <option value="learning">Đang học</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </label>
                <label className="assign-page__edit-row">
                  Tiến độ {editProgress}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={editProgress}
                    onChange={e => setEditProgress(+e.target.value)}
                  />
                </label>
                <label className="assign-page__edit-row">
                  Giờ DAT
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={editDatHours}
                    onChange={e => setEditDatHours(+e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="assign-page__btn-save"
                  onClick={handleProgressSave}
                  disabled={progressSaving}
                >
                  {progressSaving ? 'Đang lưu...' : 'Lưu tiến độ'}
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      )}
    </div>
  );
};

export default ManualAssign;
