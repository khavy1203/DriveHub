import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useApiService from '../../../services/useApiService';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { KQSHDrawerSection, KetQuaBadge } from '../../../features/kqsh';
import { TrainingProgressBlock } from '../../../features/trainingPortal';
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
  latestKQSH?: { KetQuaSH: string; NgaySH: string } | null;
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

const canEditAssignmentProgressRole = (role: string | null): boolean =>
  role === 'Admin' || role === 'SupperAdmin';

const getInitials = (name: string) =>
  name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (raw?: string) => {
  if (!raw) return '—';
  try { return new Date(raw).toLocaleDateString('vi-VN'); } catch { return raw; }
};

const HocVienManagement: React.FC = () => {
  const { get, post, put, del } = useApiService();
  const { role } = useAuth();
  const navigate = useNavigate();
  const canEditProgress = canEditAssignmentProgressRole(role);

  const [hocVienList, setHocVienList] = useState<HocVien[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [modalItem, setModalItem] = useState<HocVien | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

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
    if (modalItem?.id === s.id) setModalItem(null);
    await fetchData();
  };

  const licenseTypes = [...new Set(hocVienList.map(s => s.loaibangthi).filter(Boolean))].sort() as string[];

  const handleSyncTraining = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await post<{ EC: number; EM: string }>('/api/training/sync-all', {});
      if (res.EC === 0) {
        setSyncResult('Đồng bộ đã bắt đầu. Dữ liệu sẽ được cập nhật trong vài phút...');
        setTimeout(() => {
          fetchData();
          setSyncResult(null);
        }, 10000);
      } else {
        setSyncResult(res.EM || 'Lỗi khi bắt đầu đồng bộ');
      }
    } catch {
      setSyncResult('Lỗi kết nối server');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="hvm">
      {/* Header */}
      <div className="hvm__header">
        <div>
          <h1 className="hvm__title">Quản lý Học viên</h1>
          <p className="hvm__subtitle">
            Theo dõi và quản lý <strong>{hocVienList.length}</strong> học viên đào tạo
          </p>
        </div>
        <div className="hvm__header-actions">
          <button
            className="hvm__btn-sync"
            onClick={handleSyncTraining}
            disabled={syncing}
            title="Đồng bộ dữ liệu tiến độ từ hệ thống CSĐT"
          >
            <span className={`material-icons${syncing ? ' hvm__spin' : ''}`}>
              {syncing ? 'sync' : 'cloud_download'}
            </span>
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ CSĐT'}
          </button>
          <button className="hvm__btn-add" onClick={() => navigate('/dashboard/dang-ky-hoc-vien')}>
            <span className="material-icons">person_add</span>
            + Thêm học viên mới
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="hvm__sync-toast">
          <span className="material-icons">info</span>
          <span>{syncResult}</span>
          <button className="hvm__sync-toast-close" onClick={() => setSyncResult(null)}>
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

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
                <th className="hvm__th-center">Kết quả SH</th>
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
                    onClick={() => setModalItem(s)}
                    className="hvm__row--clickable"
                    title="Xem hồ sơ học viên"
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
                    <td className="hvm__th-center">
                      {s.latestKQSH ? (
                        <div className="hvm__kqsh-cell">
                          <KetQuaBadge kq={s.latestKQSH.KetQuaSH} />
                          <span className="hvm__kqsh-date">
                            {new Date(s.latestKQSH.NgaySH).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ) : (
                        <span className="hvm__td-muted">—</span>
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

      {/* Student detail modal */}
      {modalItem && (
        <HocVienModal
          item={modalItem}
          teachers={teachers}
          canEditProgress={canEditProgress}
          onClose={() => setModalItem(null)}
          onAssign={(s, e) => openAssign(s, e)}
          onDelete={(s, e) => handleDelete(s, e)}
          onRefresh={async (updatedFields?: Partial<HocVien>) => {
            await fetchData();
            if (updatedFields) {
              setModalItem(prev => prev ? { ...prev, ...updatedFields } : prev);
            }
          }}
          put={put}
        />
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div className="hvm__overlay hvm__overlay--above" onClick={() => setAssignTarget(null)}>
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

/* ── HocVien Detail Modal ───────────────────────────────────────────────────── */

type HocVienModalProps = {
  item: HocVien;
  teachers: Teacher[];
  canEditProgress: boolean;
  onClose: () => void;
  onAssign: (s: HocVien, e: React.MouseEvent) => void;
  onDelete: (s: HocVien, e: React.MouseEvent) => void;
  onRefresh: (updatedFields?: Partial<HocVien>) => Promise<void>;
  put: <T>(url: string, data?: object) => Promise<T>;
};

const HocVienModal: React.FC<HocVienModalProps> = ({
  item: initialItem, teachers, canEditProgress, onClose, onAssign, onDelete, onRefresh, put,
}) => {
  const [item, setItem] = useState(initialItem);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [editingInfo, setEditingInfo] = useState(false);
  const [editFields, setEditFields] = useState<Partial<HocVien>>({});
  const [savingInfo, setSavingInfo] = useState(false);

  const [progressOpen, setProgressOpen] = useState(false);
  const [editProgress, setEditProgress] = useState(initialItem.assignment?.progressPercent ?? 0);
  const [editStatus, setEditStatus] = useState<'waiting' | 'learning' | 'completed'>(
    initialItem.assignment?.status ?? 'learning',
  );
  const [editDatHours, setEditDatHours] = useState(initialItem.assignment?.datHoursCompleted ?? 0);
  const [progressSaving, setProgressSaving] = useState(false);

  useEffect(() => {
    setItem(initialItem);
    setEditingInfo(false);
    setProgressOpen(false);
    setEditProgress(initialItem.assignment?.progressPercent ?? 0);
    setEditStatus(initialItem.assignment?.status ?? 'learning');
    setEditDatHours(initialItem.assignment?.datHoursCompleted ?? 0);
    bodyRef.current?.scrollTo(0, 0);
  }, [initialItem]);

  const formatDateForInput = (raw?: string): string => {
    if (!raw) return '';
    // Cắt timestamp: "1990-01-15T00:00:00.000Z" → "1990-01-15"
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : raw;
  };

  const startEditInfo = () => {
    setEditFields({
      HoTen: item.HoTen,
      SoCCCD: item.SoCCCD ?? '',
      NgaySinh: formatDateForInput(item.NgaySinh),
      GioiTinh: item.GioiTinh ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      DiaChi: item.DiaChi ?? '',
      loaibangthi: item.loaibangthi ?? '',
    });
    // Không gọi setEditingInfo ở đây — nút toggle tự xử lý trạng thái mở/đóng
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      const res = await put<{ EC: number; EM: string; DT: HocVien }>(`/api/hocvien/${item.id}`, editFields);
      if (res.EC === 0) {
        setItem(prev => ({ ...prev, ...editFields }));
        setEditingInfo(false);
        toast.success('Cập nhật thông tin học viên thành công!');
        await onRefresh(editFields as Partial<HocVien>);
      } else {
        toast.error(res.EM || 'Lưu thất bại. Vui lòng thử lại.');
      }
    } catch {
      // httpClient đã hiện toast lỗi HTTP; catch để tránh unhandled rejection
    } finally {
      setSavingInfo(false);
    }
  };

  const handleProgressSave = async () => {
    if (!item.assignment || !canEditProgress) return;
    setProgressSaving(true);
    try {
      await put<{ EC: number }>(`/api/student-assignment/${item.assignment.id}`, {
        status: editStatus,
        progressPercent: editProgress,
        datHoursCompleted: editDatHours,
      });
      setItem(prev => prev.assignment
        ? { ...prev, assignment: { ...prev.assignment, status: editStatus, progressPercent: editProgress, datHoursCompleted: editDatHours } }
        : prev,
      );
      await onRefresh();
    } finally {
      setProgressSaving(false);
    }
  };

  const a = item.assignment;
  const tName = a?.teacher?.username ?? teachers.find(t => t.id === a?.teacherId)?.username;

  return (
    <div className="hvm__overlay hvm__overlay--detail" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="hvm-dm-title">
      <div className="hvm__detail-modal" onClick={e => e.stopPropagation()}>

        <header className="hvm__dm-header">
          <div className="hvm__dm-header-row hvm__dm-header-row--top">
            <div className="hvm__dm-header-left">
              <div className="hvm__dm-avatar">{getInitials(item.HoTen)}</div>
              <div className="hvm__dm-title-block">
                <h2 className="hvm__dm-name" id="hvm-dm-title">{item.HoTen}</h2>
                <div className="hvm__dm-badges">
                  {item.loaibangthi ? (
                    <span className="hvm__rank-badge">Hạng {item.loaibangthi}</span>
                  ) : null}
                  {a ? (
                    <span className={`hvm__status-badge hvm__status-badge--${a.status}`}>
                      {a.status === 'learning' && <span className="hvm__status-dot" />}
                      {ASSIGN_STATUS_LABEL[a.status]}
                    </span>
                  ) : null}
                  <span className="hvm__hv-status-badge">{HV_STATUS_LABEL[item.status] ?? item.status}</span>
                </div>
              </div>
            </div>
            <button type="button" className="hvm__dm-close" onClick={onClose} aria-label="Đóng">
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="hvm__dm-meta-chips">
            {item.SoCCCD ? (
              <span className="hvm__dm-chip"><span className="material-icons">badge</span>{item.SoCCCD}</span>
            ) : null}
            {item.phone ? (
              <span className="hvm__dm-chip"><span className="material-icons">phone</span>{item.phone}</span>
            ) : null}
            {item.email ? (
              <span className="hvm__dm-chip hvm__dm-chip--wide"><span className="material-icons">email</span>{item.email}</span>
            ) : null}
          </div>
          <div className="hvm__dm-toolbar">
            <button type="button" className="hvm__dm-btn hvm__dm-btn--primary" onClick={e => onAssign(item, e)}>
              <span className="material-icons">assignment_turned_in</span>
              {a ? 'Đổi giáo viên' : 'Phân công GV'}
            </button>
            {editingInfo ? (
              <>
                <button type="button" className="hvm__dm-btn hvm__dm-btn--save" onClick={handleSaveInfo} disabled={savingInfo}>
                  {savingInfo
                    ? <><span className="material-icons hvm__spin">sync</span>Đang lưu...</>
                    : <><span className="material-icons">save</span>Lưu thay đổi</>
                  }
                </button>
                <button type="button" className="hvm__dm-btn hvm__dm-btn--ghost" onClick={() => setEditingInfo(false)}>
                  <span className="material-icons">close</span>
                  Huỷ
                </button>
              </>
            ) : (
              <button type="button" className="hvm__dm-btn hvm__dm-btn--edit" onClick={() => { startEditInfo(); setEditingInfo(true); }}>
                <span className="material-icons">edit</span>
                Chỉnh sửa
              </button>
            )}
            <button
              type="button"
              className="hvm__dm-btn hvm__dm-btn--danger"
              onClick={e => { onDelete(item, e); onClose(); }}
              title="Xoá học viên"
            >
              <span className="material-icons">delete_outline</span>
              Xoá học viên
            </button>
          </div>
        </header>

        <div className="hvm__dm-body" ref={bodyRef}>
          <div className="hvm__dm-layout">

            <div className="hvm__dm-col hvm__dm-col--side">
              <div className="hvm__dm-info-grid">
                {editingInfo ? (
                  <>
                    {([
                      { key: 'HoTen',       label: 'Họ và tên',     type: 'text' },
                      { key: 'SoCCCD',      label: 'CCCD / CMND',   type: 'text' },
                      { key: 'NgaySinh',    label: 'Ngày sinh',     type: 'date' },
                      { key: 'GioiTinh',    label: 'Giới tính',     type: 'select', opts: ['Nam', 'Nữ', 'Khác'] },
                      { key: 'phone',       label: 'Số điện thoại', type: 'tel' },
                      { key: 'email',       label: 'Email',         type: 'email' },
                      { key: 'loaibangthi', label: 'Hạng bằng',     type: 'text' },
                      { key: 'DiaChi',      label: 'Địa chỉ',       type: 'textarea' },
                    ] as const).map(({ key, label, type, ...rest }) => (
                      <div
                        key={key}
                        className={`hvm__dm-info-item hvm__dm-info-item--editable${type === 'textarea' ? ' hvm__dm-info-item--full' : ''}`}
                      >
                        <span className="hvm__dm-info-label">{label}</span>
                        {type === 'select' ? (
                          <select
                            className="hvm__dm-inline-input"
                            value={(editFields as Record<string, string>)[key] ?? ''}
                            onChange={e => setEditFields(f => ({ ...f, [key]: e.target.value }))}
                          >
                            <option value="">— Chọn —</option>
                            {(rest as { opts?: string[] }).opts?.map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : type === 'textarea' ? (
                          <textarea
                            className="hvm__dm-inline-textarea"
                            rows={2}
                            value={(editFields as Record<string, string>)[key] ?? ''}
                            onChange={e => setEditFields(f => ({ ...f, [key]: e.target.value }))}
                          />
                        ) : (
                          <input
                            type={type}
                            className="hvm__dm-inline-input"
                            value={(editFields as Record<string, string>)[key] ?? ''}
                            onChange={e => setEditFields(f => ({ ...f, [key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    <div className="hvm__dm-info-item">
                      <span className="hvm__dm-info-label">Tiến độ</span>
                      <span className="hvm__dm-info-val">{a?.progressPercent ?? 0}%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hvm__dm-info-item">
                      <span className="hvm__dm-info-label">Ngày sinh</span>
                      <span className="hvm__dm-info-val">{formatDate(item.NgaySinh)}</span>
                    </div>
                    <div className="hvm__dm-info-item">
                      <span className="hvm__dm-info-label">Giới tính</span>
                      <span className="hvm__dm-info-val">{item.GioiTinh || '—'}</span>
                    </div>
                    <div className="hvm__dm-info-item">
                      <span className="hvm__dm-info-label">Tiến độ</span>
                      <span className="hvm__dm-info-val">{a?.progressPercent ?? 0}%</span>
                    </div>
                    <div className="hvm__dm-info-item hvm__dm-info-item--full">
                      <span className="hvm__dm-info-label">Địa chỉ</span>
                      <span className="hvm__dm-info-val hvm__dm-info-val--wrap">{item.DiaChi || '—'}</span>
                    </div>
                  </>
                )}
              </div>

          {/* Teacher info */}
          {tName && (
            <div className="hvm__dm-section hvm__dm-section--flat">
              <div className="hvm__dm-section-toggle hvm__dm-section-toggle--static">
                <span className="material-icons">school</span>
                <span>Giáo viên phụ trách</span>
              </div>
              <div className="hvm__dm-section-body">
                <div className="hvm__drawer-teacher">
                  <div className="hvm__teacher-avatar hvm__teacher-avatar--lg">{getInitials(tName)}</div>
                  <div>
                    <div className="hvm__drawer-teacher-name">{tName}</div>
                    {a?.notes && <div className="hvm__drawer-teacher-notes">{a.notes}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {a && canEditProgress ? (
            <div className="hvm__dm-section">
              <button type="button" className="hvm__dm-section-toggle" onClick={() => setProgressOpen(o => !o)}>
                <span className="material-icons">trending_up</span>
                <span>Cập nhật tiến độ</span>
                <span className="material-icons hvm__dm-chevron">{progressOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
              {progressOpen && (
                <div className="hvm__dm-section-body">
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
                    <button type="button" className="hvm__btn-save-progress" onClick={handleProgressSave} disabled={progressSaving}>
                      {progressSaving
                        ? <><span className="material-icons hvm__spin">sync</span>Đang lưu...</>
                        : <><span className="material-icons">save</span>Lưu tiến độ</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

            </div>

            <div className="hvm__dm-col hvm__dm-col--main">
              <div className="hvm__dm-training">
                <div className="hvm__dm-training-header">
                  <span className="material-icons">route</span>
                  <span>Tiến độ đào tạo</span>
                </div>
                <div className="hvm__dm-training-scroll">
                  <TrainingProgressBlock mode="staff" cccd={item.SoCCCD ?? null} compact />
                </div>
              </div>

              <div className="hvm__dm-section hvm__dm-section--flat">
                <div className="hvm__dm-section-toggle hvm__dm-section-toggle--static">
                  <span className="material-icons">assignment</span>
                  <span>Kết quả sát hạch</span>
                </div>
                <div className="hvm__dm-section-body">
                  <KQSHDrawerSection hocVienId={item.id} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HocVienManagement;
