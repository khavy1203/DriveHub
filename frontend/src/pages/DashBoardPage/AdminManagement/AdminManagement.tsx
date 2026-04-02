import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import type { AdminRecord, AdminDetail, AdminFormData } from './adminApi';
import {
  fetchAdmins, fetchAdminDetail,
  createAdminApi, updateAdminApi,
  toggleAdminActiveApi, deleteAdminApi,
  assignSupperTeacherApi, detachSupperTeacherApi,
} from './adminApi';
import { fetchSupperTeachers } from '../../../features/superTeacher/services/superTeacherApi';
import type { SupperTeacher } from '../../../features/superTeacher/types';
import './AdminManagement.scss';

const EMPTY_FORM: AdminFormData = { username: '', email: '', password: '', phone: '', address: '' };

// ── Admin form modal ──────────────────────────────────────────────────────────

type FormModalProps = {
  target: AdminRecord | null;
  onSave: (data: AdminFormData) => Promise<void>;
  onClose: () => void;
};

const AdminFormModal: React.FC<FormModalProps> = ({ target, onSave, onClose }) => {
  const isEdit = !!target;
  const [form, setForm] = useState<AdminFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(target
      ? { username: target.username, email: target.email, password: '', phone: target.phone ?? '', address: target.address ?? '' }
      : EMPTY_FORM);
    setError(null);
  }, [target]);

  const set = (field: keyof AdminFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="adm__overlay" onClick={onClose}>
      <div className="adm__modal" onClick={e => e.stopPropagation()}>
        <h3 className="adm__modal-title">{isEdit ? 'Cập nhật Admin' : 'Thêm Admin mới'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="adm__field">
            <label className="adm__label">Họ và tên *</label>
            <input className="adm__input" value={form.username} onChange={set('username')} placeholder="Nguyễn Văn A" required />
          </div>
          <div className="adm__field">
            <label className="adm__label">Email *</label>
            <input className="adm__input" value={form.email} onChange={set('email')} placeholder="admin@truong.vn" disabled={isEdit} required />
          </div>
          <div className="adm__field">
            <label className="adm__label">{isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}</label>
            <input className="adm__input" type="password" value={form.password} onChange={set('password')} placeholder="••••••" />
          </div>
          <div className="adm__field">
            <label className="adm__label">Số điện thoại</label>
            <input className="adm__input" value={form.phone} onChange={set('phone')} placeholder="0901234567" />
          </div>
          <div className="adm__field">
            <label className="adm__label">Địa chỉ / Tên trường</label>
            <input className="adm__input" value={form.address} onChange={set('address')} placeholder="Trường lái xe ABC, Hà Nội" />
          </div>
          {error && <p className="adm__error">{error}</p>}
          <div className="adm__modal-footer">
            <button type="button" className="adm__btn adm__btn--ghost" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="adm__btn adm__btn--primary" disabled={saving}>
              {saving ? <><span className="adm__spinner adm__spinner--sm" />Đang lưu...</> : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

// ── Delete confirm modal ──────────────────────────────────────────────────────

type DeleteModalProps = {
  target: AdminRecord;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

const DeleteModal: React.FC<DeleteModalProps> = ({ target, onConfirm, onClose }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  };

  return createPortal(
    <div className="adm__overlay" onClick={onClose}>
      <div className="adm__modal" onClick={e => e.stopPropagation()}>
        <h3 className="adm__modal-title">Xóa Admin</h3>
        <p style={{ fontSize: 14, margin: 0 }}>
          Bạn có chắc muốn xóa Admin <strong>{target.username}</strong> ({target.email})?
          {target.supperTeacherCount > 0 && (
            <><br /><span style={{ color: '#d97706' }}>⚠ {target.supperTeacherCount} SupperTeacher sẽ bị tách khỏi Admin này.</span></>
          )}
        </p>
        <div className="adm__modal-footer">
          <button className="adm__btn adm__btn--ghost" onClick={onClose} disabled={deleting}>Hủy</button>
          <button className="adm__btn adm__btn--danger" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ── Assign SupperTeacher modal ────────────────────────────────────────────────

type AssignSTModalProps = {
  admin: AdminRecord;
  allST: SupperTeacher[];
  assignedIds: number[];
  onAssign: (stId: number) => Promise<void>;
  onDetach: (stId: number) => Promise<void>;
  onClose: () => void;
};

const AssignSTModal: React.FC<AssignSTModalProps> = ({ admin, allST, assignedIds, onAssign, onDetach, onClose }) => {
  const [busy, setBusy] = useState<number | null>(null);
  const unassigned = allST.filter(st => !assignedIds.includes(st.id));

  const handle = async (fn: () => Promise<void>, stId: number) => {
    setBusy(stId);
    try { await fn(); } finally { setBusy(null); }
  };

  return createPortal(
    <div className="adm__overlay" onClick={onClose}>
      <div className="adm__modal" onClick={e => e.stopPropagation()}>
        <h3 className="adm__modal-title">Quản lý SupperTeacher — {admin.username}</h3>

        {assignedIds.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 6px' }}>ĐANG THUỘC ĐƠN VỊ</p>
            <div className="adm__st-list">
              {allST.filter(st => assignedIds.includes(st.id)).map(st => (
                <div key={st.id} className="adm__st-row">
                  <div className="adm__st-info">
                    <span className="adm__st-name">{st.username}</span>
                    <span className="adm__st-email">{st.email}</span>
                  </div>
                  <button
                    className="adm__btn adm__btn--ghost adm__btn--sm"
                    disabled={busy === st.id}
                    onClick={() => handle(() => onDetach(st.id), st.id)}
                  >
                    {busy === st.id ? <span className="adm__spinner adm__spinner--sm" /> : 'Gỡ ra'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {unassigned.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 6px' }}>CHƯA CÓ ĐƠN VỊ</p>
            <div className="adm__st-list">
              {unassigned.map(st => (
                <div key={st.id} className="adm__st-row">
                  <div className="adm__st-info">
                    <span className="adm__st-name">{st.username}</span>
                    <span className="adm__st-email">{st.email}</span>
                  </div>
                  <button
                    className="adm__btn adm__btn--primary adm__btn--sm"
                    disabled={busy === st.id}
                    onClick={() => handle(() => onAssign(st.id), st.id)}
                  >
                    {busy === st.id ? <span className="adm__spinner adm__spinner--sm" /> : 'Gán vào'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {allST.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Chưa có SupperTeacher nào trong hệ thống.</p>
        )}

        <div className="adm__modal-footer">
          <button className="adm__btn adm__btn--ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ── Connection status dot ─────────────────────────────────────────────────────

const ConnDot: React.FC<{ status: 'success' | 'error' | 'untested' | null }> = ({ status }) => {
  const s = status ?? 'untested';
  const titles: Record<string, string> = {
    success: 'Kết nối thành công',
    error: 'Kết nối thất bại',
    untested: 'Chưa kiểm tra',
  };
  return <span className={`adm__conn-dot adm__conn-dot--${s}`} title={titles[s]} />;
};

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [allST, setAllST] = useState<SupperTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminRecord | null>(null);

  const [assignTarget, setAssignTarget] = useState<AdminRecord | null>(null);
  const [assignDetail, setAssignDetail] = useState<AdminDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, stRes] = await Promise.all([fetchAdmins(), fetchSupperTeachers()]);
      if (adminsRes.EC === 0) setAdmins(adminsRes.DT ?? []);
      if (stRes.EC === 0) setAllST(stRes.DT ?? []);
    } catch {
      toast.error('Không thể tải danh sách Admin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAssign = async (admin: AdminRecord) => {
    setAssignTarget(admin);
    setLoadingDetail(true);
    try {
      const res = await fetchAdminDetail(admin.id);
      if (res.EC === 0) setAssignDetail(res.DT);
    } catch {
      toast.error('Không thể tải chi tiết Admin');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSave = async (data: AdminFormData) => {
    if (editing) {
      const { email: _e, ...rest } = data;
      const res = await updateAdminApi(editing.id, rest);
      if (res.EC !== 0) throw new Error(res.EM);
      toast.success('Cập nhật thành công');
    } else {
      const res = await createAdminApi(data);
      if (res.EC !== 0) throw new Error(res.EM);
      toast.success('Tạo Admin thành công — Email thiết lập mật khẩu đã được gửi');
    }
    await load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await deleteAdminApi(confirmDelete.id);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Đã xóa Admin');
    setConfirmDelete(null);
    await load();
  };

  const handleToggle = async (admin: AdminRecord) => {
    const res = await toggleAdminActiveApi(admin.id);
    if (res.EC !== 0) { toast.error(res.EM); return; }
    toast.success(`Đã ${admin.active ? 'vô hiệu hóa' : 'kích hoạt'} Admin`);
    await load();
  };

  const handleAssign = async (stId: number) => {
    if (!assignTarget) return;
    const res = await assignSupperTeacherApi(assignTarget.id, stId);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Đã gán SupperTeacher');
    const detailRes = await fetchAdminDetail(assignTarget.id);
    if (detailRes.EC === 0) setAssignDetail(detailRes.DT);
    await load();
  };

  const handleDetach = async (stId: number) => {
    const res = await detachSupperTeacherApi(stId);
    if (res.EC !== 0) throw new Error(res.EM);
    toast.success('Đã gỡ SupperTeacher');
    if (assignTarget) {
      const detailRes = await fetchAdminDetail(assignTarget.id);
      if (detailRes.EC === 0) setAssignDetail(detailRes.DT);
    }
    await load();
  };

  const assignedIds = assignDetail?.managedSupperTeachers?.map(st => st.id) ?? [];

  return (
    <div className="adm">
      <div className="adm__header">
        <h1 className="adm__title">Quản lý Admin / Đơn vị đào tạo</h1>
        <button className="adm__btn adm__btn--primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <span className="material-icons">add</span>
          Thêm Admin mới
        </button>
      </div>

      {loading ? (
        <div className="adm__loading">
          <span className="adm__spinner" />
          Đang tải...
        </div>
      ) : (
        <div className="adm__table-wrap">
          <table className="adm__table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Địa chỉ / Trường</th>
                <th>Trạng thái</th>
                <th>SupperTeachers</th>
                <th>API</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 && (
                <tr><td colSpan={9} className="adm__empty">Chưa có Admin nào. Nhấn "Thêm Admin mới" để bắt đầu.</td></tr>
              )}
              {admins.map((admin, i) => (
                <tr key={admin.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{admin.username}</td>
                  <td style={{ color: '#6b7280' }}>{admin.email}</td>
                  <td>{admin.phone || '—'}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {admin.address || '—'}
                  </td>
                  <td>
                    <span className={`adm__badge ${admin.active ? 'adm__badge--active' : 'adm__badge--inactive'}`}>
                      {admin.active ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="adm__btn adm__btn--ghost adm__btn--sm"
                      onClick={() => openAssign(admin)}
                      title="Quản lý SupperTeacher thuộc đơn vị này"
                    >
                      {admin.supperTeacherCount} ST
                      <span className="material-icons" style={{ fontSize: 13 }}>group</span>
                    </button>
                  </td>
                  <td>
                    <ConnDot status={admin.serverConfig?.lastTestStatus ?? null} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {admin.serverConfig?.apiBaseUrl ? 'Đã cấu hình' : 'Chưa cấu hình'}
                    </span>
                  </td>
                  <td>
                    <div className="adm__actions">
                      <button
                        className="adm__btn adm__btn--ghost adm__btn--sm"
                        onClick={() => { setEditing(admin); setShowForm(true); }}
                        title="Sửa"
                      >
                        <span className="material-icons" style={{ fontSize: 14 }}>edit</span>
                      </button>
                      <button
                        className="adm__btn adm__btn--ghost adm__btn--sm"
                        onClick={() => handleToggle(admin)}
                        title={admin.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        <span className="material-icons" style={{ fontSize: 14, color: admin.active ? '#d97706' : '#16a34a' }}>
                          {admin.active ? 'block' : 'check_circle'}
                        </span>
                      </button>
                      <button
                        className="adm__btn adm__btn--danger adm__btn--sm"
                        onClick={() => setConfirmDelete(admin)}
                        title="Xóa"
                      >
                        <span className="material-icons" style={{ fontSize: 14 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <AdminFormModal
          target={editing}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      {confirmDelete && (
        <DeleteModal
          target={confirmDelete}
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {assignTarget && !loadingDetail && assignDetail && (
        <AssignSTModal
          admin={assignTarget}
          allST={allST}
          assignedIds={assignedIds}
          onAssign={handleAssign}
          onDetach={handleDetach}
          onClose={() => { setAssignTarget(null); setAssignDetail(null); }}
        />
      )}
    </div>
  );
};

export default AdminManagement;
