import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAdminFilter } from '../../../features/auth/context/AdminFilterContext';
import { toast } from 'react-toastify';
import type { SupperTeacher, SupperTeacherFormData, TeacherInTeam, TeacherFormData, InstructorProfile } from '../../../features/superTeacher/types';
import {
  fetchSupperTeachers,
  createSupperTeacherApi,
  updateSupperTeacherApi,
  deleteSupperTeacherApi,
  previewDeleteSupperTeacher,
  fetchTeachersWithoutSupper,
  fetchTeachersInTeam,
  reassignTeacherApi,
  createTeacherByAdminApi,
  promoteTeacherApi,
  demoteSuperTeacherApi,
} from '../../../features/superTeacher/services/superTeacherApi';
import ImportSupperTeacherModal from '../../../features/superTeacher/components/ImportSupperTeacherModal';
import './SupperTeacherManagement.scss';

const EMPTY_ST_FORM: SupperTeacherFormData = { username: '', email: '', password: '', phone: '', address: '' };
const EMPTY_TEACHER_FORM: TeacherFormData & { superTeacherId: number | '' } = {
  username: '', email: '', password: '', phone: '', address: '', superTeacherId: '',
};

// ── SupperTeacher form modal ─────────────────────────────────────────────────

type STFormModalProps = {
  target: SupperTeacher | null;
  onSave: (data: SupperTeacherFormData) => Promise<void>;
  onClose: () => void;
};

const STFormModal: React.FC<STFormModalProps> = ({ target, onSave, onClose }) => {
  const isEdit = !!target;
  const [form, setForm] = useState<SupperTeacherFormData>(EMPTY_ST_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(target
      ? { username: target.username, email: target.email, password: '', phone: target.phone ?? '', address: target.address ?? '' }
      : EMPTY_ST_FORM
    );
    setError(null);
  }, [target]);

  const set = (field: keyof SupperTeacherFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) { setError('Tên và Email không được để trống'); return; }
    if (!isEdit && !form.password.trim()) { setError('Mật khẩu không được để trống khi tạo mới'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{isEdit ? 'Cập nhật SupperTeacher' : 'Thêm SupperTeacher mới'}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          {isEdit && target?.cccd && (
            <>
              <label>Số CCCD</label>
              <input value={target.cccd} readOnly className="input-readonly" />
            </>
          )}
          <label>Họ và tên *</label>
          <input value={form.username} onChange={set('username')} placeholder="Nguyễn Văn A" required />
          <label>Email *</label>
          <input value={form.email} onChange={set('email')} placeholder="st@example.com" disabled={isEdit} required />
          <label>{isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="••••••" />
          <label>Số điện thoại</label>
          <input value={form.phone} onChange={set('phone')} placeholder="0901234567" />
          <label>Địa chỉ</label>
          <input value={form.address} onChange={set('address')} placeholder="Địa chỉ..." />
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Teacher form modal (admin creates teacher + assigns to ST) ───────────────

type TeacherFormModalProps = {
  supperTeachers: SupperTeacher[];
  onSave: (superTeacherId: number, data: TeacherFormData) => Promise<void>;
  onClose: () => void;
};

const TeacherCreateModal: React.FC<TeacherFormModalProps> = ({ supperTeachers, onSave, onClose }) => {
  const [form, setForm] = useState(EMPTY_TEACHER_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: field === 'superTeacherId' ? (e.target.value ? Number(e.target.value) : '') : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) { setError('Tên và Email không được để trống'); return; }
    if (!form.password.trim()) { setError('Mật khẩu không được để trống'); return; }
    if (!form.superTeacherId) { setError('Phải chọn SupperTeacher quản lý'); return; }
    setSaving(true);
    setError(null);
    try {
      const { superTeacherId, ...teacherData } = form;
      await onSave(superTeacherId as number, teacherData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Tạo giáo viên mới</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Thuộc SupperTeacher *</label>
          <select value={form.superTeacherId} onChange={set('superTeacherId')} required>
            <option value="">— Chọn SupperTeacher —</option>
            {supperTeachers.map(st => (
              <option key={st.id} value={st.id}>{st.username} ({st.email})</option>
            ))}
          </select>
          <label>Họ và tên *</label>
          <input value={form.username} onChange={set('username')} placeholder="Nguyễn Văn A" required />
          <label>Email *</label>
          <input value={form.email} onChange={set('email')} placeholder="gv@example.com" required />
          <label>Mật khẩu *</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="••••••" />
          <label>Số điện thoại</label>
          <input value={form.phone} onChange={set('phone')} placeholder="0901234567" />
          <label>Địa chỉ</label>
          <input value={form.address} onChange={set('address')} placeholder="Địa chỉ..." />
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo giáo viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Reassign modal ───────────────────────────────────────────────────────────

type ReassignModalProps = {
  teacher: TeacherInTeam;
  supperTeachers: SupperTeacher[];
  onSave: (teacherId: number, newStId: number) => Promise<void>;
  onClose: () => void;
};

const ReassignModal: React.FC<ReassignModalProps> = ({ teacher, supperTeachers, onSave, onClose }) => {
  const [selectedStId, setSelectedStId] = useState<number | ''>(teacher.superTeacherId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedStId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(teacher.id, selectedStId as number);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-confirm" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Gán SupperTeacher</h3>
        <p>Chọn SupperTeacher cho giáo viên <strong>{teacher.username}</strong>:</p>
        <div className="modal-form">
          <select value={selectedStId} onChange={e => setSelectedStId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">— Chọn SupperTeacher —</option>
            {supperTeachers.map(st => (
              <option key={st.id} value={st.id}>{st.username} ({st.email})</option>
            ))}
          </select>
        </div>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!selectedStId || saving}>
            {saving ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete confirm modal ─────────────────────────────────────────────────────

type DeleteModalProps = {
  target: SupperTeacher;
  preview: TeacherInTeam[];
  loadingPreview: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

const DeleteModal: React.FC<DeleteModalProps> = ({ target, preview, loadingPreview, onConfirm, onClose }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-confirm" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Xác nhận xóa</h3>
        <p>Bạn có chắc muốn xóa SupperTeacher <strong>{target.username}</strong>?</p>
        {loadingPreview ? (
          <p className="st-loading">Đang kiểm tra...</p>
        ) : preview.length > 0 ? (
          <>
            <p style={{ color: '#b91c1c', fontSize: 13, margin: '8px 0 4px' }}>
              Hành động này sẽ xóa <strong>{preview.length}</strong> giáo viên trong đội:
            </p>
            <ul className="preview-list">
              {preview.map(t => <li key={t.id}>{t.username} — {t.email}</li>)}
            </ul>
          </>
        ) : (
          <p style={{ fontSize: 13, color: '#64748b' }}>Không có giáo viên nào trong đội.</p>
        )}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={deleting}>Hủy</button>
          <button className="btn-danger" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Demote modal ────────────────────────────────────────────────────────────

type DemoteModalProps = {
  target: SupperTeacher;
  supperTeachers: SupperTeacher[];
  onConfirm: (newManagerId: number) => Promise<void>;
  onClose: () => void;
};

const DemoteModal: React.FC<DemoteModalProps> = ({ target, supperTeachers, onConfirm, onClose }) => {
  const others = supperTeachers.filter(st => st.id !== target.id);
  const [selectedId, setSelectedId] = useState<number | ''>(others.length === 1 ? others[0].id : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(selectedId as number);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-confirm" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Hạ cấp SupperTeacher</h3>
        <p>
          Hạ <strong>{target.username}</strong> xuống thành giáo viên.
          Các giáo viên trong đội và học viên sẽ được chuyển sang SupperTeacher tiếp nhận.
          Học viên do <strong>{target.username}</strong> trực tiếp dạy vẫn được giữ nguyên.
        </p>
        <div className="modal-form">
          <label>SupperTeacher tiếp nhận *</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">— Chọn SupperTeacher —</option>
            {others.map(st => (
              <option key={st.id} value={st.id}>{st.username} ({st.email})</option>
            ))}
          </select>
        </div>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!selectedId || saving}>
            {saving ? 'Đang xử lý...' : 'Xác nhận hạ cấp'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Promote confirm modal ───────────────────────────────────────────────────

type PromoteModalProps = {
  teacher: TeacherInTeam;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

const PromoteModal: React.FC<PromoteModalProps> = ({ teacher, onConfirm, onClose }) => {
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-confirm" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Nâng cấp thành SupperTeacher</h3>
        <p>
          Nâng cấp <strong>{teacher.username}</strong> thành SupperTeacher.
          Học viên do họ trực tiếp dạy vẫn được giữ nguyên.
        </p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Đang xử lý...' : 'Xác nhận nâng cấp'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Profile detail modal ────────────────────────────────────────────────────

type ProfileDetailModalProps = {
  teacher: SupperTeacher;
  onClose: () => void;
};

const formatDate = (val?: string | null): string => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('vi-VN');
};

const ProfileField: React.FC<{ icon: string; label: string; value?: string | null }> = ({ icon, label, value }) => (
  <div className="st-profile__field">
    <span className="material-icons st-profile__field-icon">{icon}</span>
    <div>
      <div className="st-profile__field-label">{label}</div>
      <div className="st-profile__field-value">{value || '—'}</div>
    </div>
  </div>
);

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ teacher, onClose }) => {
  const p: InstructorProfile | null = teacher.profile ?? null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="st-profile-modal" onClick={e => e.stopPropagation()}>
        <button className="st-profile__close" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>

        <div className="st-profile__header">
          <div className="st-profile__avatar">
            <span className="material-icons">person</span>
          </div>
          <h3 className="st-profile__name">{p?.fullName || teacher.username}</h3>
          <div className="st-profile__badges">
            <span className={`badge ${teacher.staffType === 'official' ? 'badge-official' : 'badge-auxiliary'}`}>
              {teacher.staffType === 'official' ? 'Chính thức' : 'Phụ'}
            </span>
            <span className={`badge ${teacher.active ? 'badge-active' : 'badge-inactive'}`}>
              {teacher.active ? 'Hoạt động' : 'Ngừng'}
            </span>
          </div>
        </div>

        {!p ? (
          <div className="st-profile__empty">
            <span className="material-icons">info</span>
            Chưa có hồ sơ giảng viên. Hãy import dữ liệu từ file Excel.
          </div>
        ) : (
          <div className="st-profile__body">
            <div className="st-profile__section">
              <h4 className="st-profile__section-title">
                <span className="material-icons">badge</span> Thông tin cá nhân
              </h4>
              <div className="st-profile__grid">
                <ProfileField icon="fingerprint" label="Số CCCD" value={p.cccd} />
                <ProfileField icon="person" label="Họ và tên" value={p.fullName} />
                <ProfileField icon="wc" label="Giới tính" value={p.gender} />
                <ProfileField icon="cake" label="Ngày sinh" value={formatDate(p.dateOfBirth)} />
                <ProfileField icon="home" label="Nơi cư trú" value={p.residence} />
              </div>
            </div>

            <div className="st-profile__section">
              <h4 className="st-profile__section-title">
                <span className="material-icons">workspace_premium</span> Giấy chứng nhận
              </h4>
              <div className="st-profile__grid">
                <ProfileField icon="description" label="Số GCN giáo viên" value={p.gcnGvNumber} />
                <ProfileField icon="description" label="Số GCN cơ sở" value={p.gcnCsNumber} />
                <ProfileField icon="event" label="Ngày cấp GCN" value={formatDate(p.gcnIssueDate)} />
                <ProfileField icon="event_busy" label="HSD GCN giáo viên" value={formatDate(p.gcnGvExpiry)} />
                <ProfileField icon="event_busy" label="HSD GCN cơ sở" value={formatDate(p.gcnCsExpiry)} />
              </div>
            </div>

            <div className="st-profile__section">
              <h4 className="st-profile__section-title">
                <span className="material-icons">directions_car</span> Giấy phép & Trình độ
              </h4>
              <div className="st-profile__grid">
                <ProfileField icon="class" label="Hạng giảng dạy" value={p.teachingLicenseClass} />
                <ProfileField icon="credit_card" label="Số GPLX" value={p.licenseNumber} />
                <ProfileField icon="category" label="Hạng GPLX" value={p.licenseClass} />
                <ProfileField icon="school" label="Trình độ chuyên môn" value={p.qualification} />
                <ProfileField icon="menu_book" label="Trình độ văn hoá" value={p.educationLevel} />
                <ProfileField icon="timeline" label="Thâm niên" value={p.seniority} />
                <ProfileField icon="directions_car" label="Xe giảng dạy" value={p.teachingVehicle} />
                <ProfileField icon="credit_card" label="Số GPLX" value={p.licenseNumber} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const SupperTeacherManagement: React.FC = () => {
  const { selectedAdminId } = useAdminFilter();
  const prevAdminIdRef = useRef(selectedAdminId);

  const [supperTeachers, setSupperTeachers] = useState<SupperTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSTForm, setShowSTForm] = useState(false);
  const [editing, setEditing] = useState<SupperTeacher | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SupperTeacher | null>(null);
  const [deletePreview, setDeletePreview] = useState<TeacherInTeam[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Unassigned teachers
  const [unassigned, setUnassigned] = useState<TeacherInTeam[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<TeacherInTeam | null>(null);

  // Create teacher modal
  const [showTeacherForm, setShowTeacherForm] = useState(false);

  // Expanded team view
  const [expandedStId, setExpandedStId] = useState<number | null>(null);
  const [teamTeachers, setTeamTeachers] = useState<TeacherInTeam[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Promote / Demote
  const [demoteTarget, setDemoteTarget] = useState<SupperTeacher | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<TeacherInTeam | null>(null);

  // Import modal
  const [showImport, setShowImport] = useState(false);

  // Profile detail modal
  const [profileTarget, setProfileTarget] = useState<SupperTeacher | null>(null);

  // Mobile popup
  const [popupST, setPopupST] = useState<SupperTeacher | null>(null);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return supperTeachers;
    const q = searchQuery.toLowerCase();
    return supperTeachers.filter(st =>
      st.username.toLowerCase().includes(q) ||
      (st.email ?? '').toLowerCase().includes(q) ||
      (st.cccd ?? '').includes(q) ||
      (st.phone ?? '').includes(q),
    );
  }, [supperTeachers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [searchQuery, selectedAdminId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSupperTeachers(selectedAdminId);
      if (res.EC === 0) setSupperTeachers(res.DT ?? []);
      else toast.error(res.EM);
    } catch {
      toast.error('Không thể tải danh sách SupperTeacher');
    } finally {
      setLoading(false);
    }
  }, [selectedAdminId]);

  const loadUnassigned = useCallback(async () => {
    setLoadingUnassigned(true);
    try {
      const res = await fetchTeachersWithoutSupper();
      if (res.EC === 0) setUnassigned(res.DT ?? []);
    } catch {
      // silent
    } finally {
      setLoadingUnassigned(false);
    }
  }, []);

  useEffect(() => { load(); loadUnassigned(); }, [load, loadUnassigned]);

  // Reload when admin filter changes
  useEffect(() => {
    if (prevAdminIdRef.current !== selectedAdminId) {
      prevAdminIdRef.current = selectedAdminId;
      setExpandedStId(null);
      load();
    }
  }, [selectedAdminId, load]);

  const toggleTeamExpand = async (stId: number) => {
    if (expandedStId === stId) {
      setExpandedStId(null);
      setTeamTeachers([]);
      return;
    }
    setExpandedStId(stId);
    setLoadingTeam(true);
    try {
      const res = await fetchTeachersInTeam(stId);
      if (res.EC === 0) setTeamTeachers(res.DT ?? []);
      else toast.error(res.EM);
    } catch {
      toast.error('Không thể tải danh sách giáo viên trong đội');
    } finally {
      setLoadingTeam(false);
    }
  };

  const refreshExpandedTeam = async () => {
    if (expandedStId == null) return;
    try {
      const res = await fetchTeachersInTeam(expandedStId);
      if (res.EC === 0) setTeamTeachers(res.DT ?? []);
    } catch {
      // silent
    }
  };

  const openAdd = () => { setEditing(null); setShowSTForm(true); };
  const openEdit = (st: SupperTeacher) => { setEditing(st); setShowSTForm(true); };

  const openDelete = async (st: SupperTeacher) => {
    setConfirmDelete(st);
    setDeletePreview([]);
    setLoadingPreview(true);
    try {
      const res = await previewDeleteSupperTeacher(st.id);
      if (res.EC === 0) setDeletePreview(res.DT ?? []);
    } catch {
      // non-critical
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveST = async (data: SupperTeacherFormData) => {
    if (editing) {
      const { email: _e, ...rest } = data;
      const res = await updateSupperTeacherApi(editing.id, rest);
      if (res.EC !== 0) throw new Error(res.EM);
      toast.success('Cập nhật thành công');
    } else {
      const res = await createSupperTeacherApi(data);
      if (res.EC !== 0) throw new Error(res.EM);
      toast.success('Tạo SupperTeacher thành công');
    }
    await load();
  };

  const handleDeleteST = async () => {
    if (!confirmDelete) return;
    const res = await deleteSupperTeacherApi(confirmDelete.id);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Đã xóa SupperTeacher');
    setConfirmDelete(null);
    if (expandedStId === confirmDelete.id) {
      setExpandedStId(null);
      setTeamTeachers([]);
    }
    await Promise.all([load(), loadUnassigned()]);
  };

  const handleCreateTeacher = async (superTeacherId: number, data: TeacherFormData) => {
    const res = await createTeacherByAdminApi(superTeacherId, data);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Tạo giáo viên thành công');
    await Promise.all([load(), refreshExpandedTeam()]);
  };

  const handleReassign = async (teacherId: number, newStId: number) => {
    const res = await reassignTeacherApi(teacherId, newStId);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Đã gán SupperTeacher');
    await Promise.all([load(), loadUnassigned(), refreshExpandedTeam()]);
  };

  const handlePromote = async () => {
    if (!promoteTarget) return;
    const res = await promoteTeacherApi(promoteTarget.id);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success(`Đã nâng cấp ${promoteTarget.username} thành SupperTeacher`);
    setExpandedStId(null);
    setTeamTeachers([]);
    await Promise.all([load(), loadUnassigned()]);
  };

  const handleDemote = async (newManagerId: number) => {
    if (!demoteTarget) return;
    const res = await demoteSuperTeacherApi(demoteTarget.id, newManagerId);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success(`Đã hạ cấp ${demoteTarget.username} thành giáo viên`);
    setExpandedStId(null);
    setTeamTeachers([]);
    await Promise.all([load(), loadUnassigned()]);
  };

  return (
    <div className="st-page">
      {/* ── SupperTeacher table ──────────────────────────────────────────────── */}
      <div className="st-header">
        <h2>Quản lý SupperTeacher</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            <span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle' }}>upload_file</span> Import GV
          </button>
          <button className="btn-secondary" onClick={() => setShowTeacherForm(true)}>+ Tạo giáo viên</button>
          <button className="btn-primary" onClick={openAdd}>+ Thêm SupperTeacher</button>
        </div>
      </div>

      {/* Search bar */}
      <div className="st-search-bar">
        <span className="material-icons">search</span>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, CCCD, SĐT..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="st-search-clear" onClick={() => setSearchQuery('')}>
            <span className="material-icons">close</span>
          </button>
        )}
      </div>

      {loading ? (
        <p className="st-loading">Đang tải...</p>
      ) : (
        <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>CCCD</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Số GV</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="st-empty">{searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có SupperTeacher nào'}</td></tr>
            )}
            {paged.map((st, i) => (
              <React.Fragment key={st.id}>
                <tr
                  className={expandedStId === st.id ? 'st-row--expanded' : ''}
                  onClick={() => { if (window.innerWidth <= 768) setPopupST(st); }}
                >
                  <td>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                  <td>{st.username}</td>
                  <td>{st.cccd || '—'}</td>
                  <td>{st.email}</td>
                  <td>{st.phone || '—'}</td>
                  <td>
                    <span className={`badge ${st.staffType === 'official' ? 'badge-official' : 'badge-auxiliary'}`}>
                      {st.staffType === 'official' ? 'Chính thức' : 'Phụ'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${st.active ? 'badge-active' : 'badge-inactive'}`}>
                      {st.active ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="st-team-toggle"
                      onClick={() => toggleTeamExpand(st.id)}
                      title="Xem giáo viên trong đội"
                    >
                      <span className="badge-count">{st.teacherCount}</span>
                      <span className="material-icons st-team-toggle-icon">
                        {expandedStId === st.id ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </td>
                  <td className="st-actions">
                    <button className="btn-icon" onClick={() => setProfileTarget(st)} title="Xem hồ sơ">
                      <span className="material-icons" style={{ fontSize: 18, color: '#0ea5e9' }}>visibility</span>
                    </button>
                    <button className="btn-icon" onClick={() => openEdit(st)} title="Sửa">✏️</button>
                    <button className="btn-icon" onClick={() => setDemoteTarget(st)} title="Hạ cấp thành giáo viên">
                      <span className="material-icons" style={{ fontSize: 18, color: '#f59e0b' }}>arrow_downward</span>
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => openDelete(st)} title="Xóa">🗑️</button>
                  </td>
                </tr>

                {/* Expanded team view */}
                {expandedStId === st.id && (
                  <tr className="st-team-row">
                    <td colSpan={9}>
                      <div className="st-team-panel">
                        <div className="st-team-panel-header">
                          <h4>Giáo viên trong đội — {st.username}</h4>
                        </div>
                        {loadingTeam ? (
                          <p className="st-loading">Đang tải...</p>
                        ) : teamTeachers.length === 0 ? (
                          <p className="st-team-empty">Chưa có giáo viên nào trong đội này.</p>
                        ) : (
                          <table className="st-team-table">
                            <thead>
                              <tr>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teamTeachers.map(t => (
                                <tr key={t.id}>
                                  <td>{t.username}</td>
                                  <td>{t.email}</td>
                                  <td>{t.phone || '—'}</td>
                                  <td>
                                    <span className={`badge ${t.active ? 'badge-active' : 'badge-inactive'}`}>
                                      {t.active ? 'Hoạt động' : 'Ngừng'}
                                    </span>
                                  </td>
                                  <td className="st-actions">
                                    <button
                                      className="btn-secondary"
                                      style={{ padding: '4px 12px', fontSize: 13 }}
                                      onClick={() => setReassignTarget(t)}
                                    >
                                      Chuyển đội
                                    </button>
                                    <button
                                      className="btn-secondary"
                                      style={{ padding: '4px 12px', fontSize: 13, color: '#059669' }}
                                      onClick={() => setPromoteTarget(t)}
                                    >
                                      Nâng cấp
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="st-pagination">
            <span className="st-pagination__info">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
            </span>
            <div className="st-pagination__btns">
              <button
                className="st-pagination__btn"
                disabled={currentPage <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, idx) =>
                  typeof n === 'string' ? (
                    <span key={`dot-${idx}`} className="st-pagination__dots">...</span>
                  ) : (
                    <button
                      key={n}
                      className={`st-pagination__btn ${n === currentPage ? 'st-pagination__btn--active' : ''}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ),
                )}
              <button
                className="st-pagination__btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* ── Unassigned teachers ──────────────────────────────────────────────── */}
      {unassigned.length > 0 && (
        <>
          <div className="st-header" style={{ marginTop: 32 }}>
            <h2>Giáo viên chưa có SupperTeacher <span className="badge-count">{unassigned.length}</span></h2>
          </div>
          {loadingUnassigned ? (
            <p className="st-loading">Đang tải...</p>
          ) : (
            <table className="st-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>{t.username}</td>
                    <td>{t.email}</td>
                    <td>{t.phone || '—'}</td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => setReassignTarget(t)}>
                        Gán SupperTeacher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showSTForm && (
        <STFormModal
          target={editing}
          onSave={handleSaveST}
          onClose={() => setShowSTForm(false)}
        />
      )}

      {confirmDelete && (
        <DeleteModal
          target={confirmDelete}
          preview={deletePreview}
          loadingPreview={loadingPreview}
          onConfirm={handleDeleteST}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {showTeacherForm && (
        <TeacherCreateModal
          supperTeachers={supperTeachers}
          onSave={handleCreateTeacher}
          onClose={() => setShowTeacherForm(false)}
        />
      )}

      {reassignTarget && (
        <ReassignModal
          teacher={reassignTarget}
          supperTeachers={supperTeachers}
          onSave={handleReassign}
          onClose={() => setReassignTarget(null)}
        />
      )}

      {demoteTarget && (
        <DemoteModal
          target={demoteTarget}
          supperTeachers={supperTeachers}
          onConfirm={handleDemote}
          onClose={() => setDemoteTarget(null)}
        />
      )}

      {showImport && (
        <ImportSupperTeacherModal
          onClose={() => setShowImport(false)}
          onSuccess={load}
          adminId={selectedAdminId}
        />
      )}

      {promoteTarget && (
        <PromoteModal
          teacher={promoteTarget}
          onConfirm={handlePromote}
          onClose={() => setPromoteTarget(null)}
        />
      )}

      {profileTarget && (
        <ProfileDetailModal
          teacher={profileTarget}
          onClose={() => setProfileTarget(null)}
        />
      )}

      {/* ── Mobile popup (bottom-sheet) ─────────────────────────────────────── */}
      {popupST && createPortal(
        <div className="st-popup-overlay">
          <div className="st-popup" onClick={e => e.stopPropagation()}>
            <div className="st-popup__handle" />
            <p className="st-popup__name">{popupST.username}</p>
            <p className="st-popup__sub">SupperTeacher</p>
            <div className="st-popup__fields">
              <div className="st-popup__field">
                <span className="material-icons">email</span>
                <div>
                  <div className="st-popup__field-label">Email</div>
                  <div className="st-popup__field-value">{popupST.email}</div>
                </div>
              </div>
              <div className="st-popup__field">
                <span className="material-icons">phone</span>
                <div>
                  <div className="st-popup__field-label">SĐT</div>
                  <div className="st-popup__field-value">{popupST.phone || '—'}</div>
                </div>
              </div>
              <div className="st-popup__field">
                <span className="material-icons">toggle_on</span>
                <div>
                  <div className="st-popup__field-label">Trạng thái</div>
                  <div className="st-popup__field-value">
                    <span className={`badge ${popupST.active ? 'badge-active' : 'badge-inactive'}`}>
                      {popupST.active ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="st-popup__field">
                <span className="material-icons">groups</span>
                <div>
                  <div className="st-popup__field-label">Số giáo viên</div>
                  <div className="st-popup__field-value">{popupST.teacherCount}</div>
                </div>
              </div>
            </div>
            <div className="st-popup__actions">
              <button
                className="st-popup__btn st-popup__btn--primary"
                onClick={() => { setPopupST(null); setProfileTarget(popupST); }}
              >
                <span className="material-icons" style={{ fontSize: 16 }}>visibility</span> Hồ sơ
              </button>
              <button
                className="st-popup__btn st-popup__btn--primary"
                onClick={() => { setPopupST(null); openEdit(popupST); }}
              >
                <span className="material-icons" style={{ fontSize: 16 }}>edit</span> Sửa
              </button>
              <button
                className="st-popup__btn st-popup__btn--ghost"
                onClick={() => { setPopupST(null); setDemoteTarget(popupST); }}
              >
                <span className="material-icons" style={{ fontSize: 16 }}>arrow_downward</span> Hạ cấp
              </button>
              <button
                className="st-popup__btn st-popup__btn--danger"
                onClick={() => { setPopupST(null); openDelete(popupST); }}
              >
                <span className="material-icons" style={{ fontSize: 16 }}>delete</span> Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SupperTeacherManagement;
