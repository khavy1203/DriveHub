import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import type { SupperTeacher, SupperTeacherFormData, TeacherInTeam, TeacherFormData } from '../../../features/superTeacher/types';
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{isEdit ? 'Cập nhật SupperTeacher' : 'Thêm SupperTeacher mới'}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
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
    <div className="modal-backdrop" onClick={onClose}>
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
    <div className="modal-backdrop" onClick={onClose}>
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
    <div className="modal-backdrop" onClick={onClose}>
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
    <div className="modal-backdrop" onClick={onClose}>
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
    <div className="modal-backdrop" onClick={onClose}>
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

// ── Main page ────────────────────────────────────────────────────────────────

const SupperTeacherManagement: React.FC = () => {
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSupperTeachers();
      if (res.EC === 0) setSupperTeachers(res.DT ?? []);
      else toast.error(res.EM);
    } catch {
      toast.error('Không thể tải danh sách SupperTeacher');
    } finally {
      setLoading(false);
    }
  }, []);

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowTeacherForm(true)}>+ Tạo giáo viên</button>
          <button className="btn-primary" onClick={openAdd}>+ Thêm SupperTeacher</button>
        </div>
      </div>

      {loading ? (
        <p className="st-loading">Đang tải...</p>
      ) : (
        <table className="st-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Trạng thái</th>
              <th>Số GV</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {supperTeachers.length === 0 && (
              <tr><td colSpan={7} className="st-empty">Chưa có SupperTeacher nào</td></tr>
            )}
            {supperTeachers.map((st, i) => (
              <React.Fragment key={st.id}>
                <tr className={expandedStId === st.id ? 'st-row--expanded' : ''}>
                  <td>{i + 1}</td>
                  <td>{st.username}</td>
                  <td>{st.email}</td>
                  <td>{st.phone || '—'}</td>
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
                    <td colSpan={7}>
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

      {promoteTarget && (
        <PromoteModal
          teacher={promoteTarget}
          onConfirm={handlePromote}
          onClose={() => setPromoteTarget(null)}
        />
      )}
    </div>
  );
};

export default SupperTeacherManagement;
