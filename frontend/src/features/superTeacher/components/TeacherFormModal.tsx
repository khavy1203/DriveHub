import React, { useEffect, useState } from 'react';
import type { TeacherInTeam, TeacherFormData } from '../types';

type Props = {
  teacher: TeacherInTeam | null;
  onSave: (data: TeacherFormData) => Promise<void>;
  onClose: () => void;
};

const EMPTY: TeacherFormData = { username: '', email: '', password: '', phone: '', address: '' };

const TeacherFormModal: React.FC<Props> = ({ teacher, onSave, onClose }) => {
  const [form, setForm] = useState<TeacherFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!teacher;

  useEffect(() => {
    setForm(teacher
      ? { username: teacher.username, email: teacher.email, password: '', phone: teacher.phone ?? '', address: teacher.address ?? '' }
      : EMPTY
    );
    setError(null);
  }, [teacher]);

  const set = (field: keyof TeacherFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
        <h3 className="modal-title">{isEdit ? 'Cập nhật giáo viên' : 'Thêm giáo viên mới'}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Họ và tên *</label>
          <input value={form.username} onChange={set('username')} placeholder="Nguyễn Văn A" required />
          <label>Email *</label>
          <input value={form.email} onChange={set('email')} placeholder="giaovien@example.com" disabled={isEdit} required />
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

export default TeacherFormModal;
