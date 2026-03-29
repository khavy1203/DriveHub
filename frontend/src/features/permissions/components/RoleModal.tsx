import React, { useEffect, useState } from 'react';
import type { Role } from '../types';

type Props = {
  role?: Role | null;
  onSave: (payload: { url: string; description?: string }) => Promise<void>;
  onClose: () => void;
};

const RoleModal: React.FC<Props> = ({ role, onSave, onClose }) => {
  const isEdit = !!role;
  const [url, setUrl] = useState(role?.url ?? '/');
  const [description, setDescription] = useState(role?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUrl(role?.url ?? '/');
    setDescription(role?.description ?? '');
    setError('');
  }, [role]);

  const urlSeg = url.trim() || '/';
  const previewMatches = [
    `POST /api${urlSeg}`,
    `PUT  /api${urlSeg}/123`,
    `DELETE /api${urlSeg}/456`,
  ];

  const handleSave = async () => {
    if (!url.trim() || !url.startsWith('/')) {
      setError('URL phải bắt đầu bằng /');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ url: url.trim(), description: description.trim() || undefined });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { EM?: string } } })?.response?.data?.EM ?? 'Lỗi lưu dữ liệu';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="perm__modal-overlay" onClick={onClose}>
      <div className="perm__modal" onClick={e => e.stopPropagation()}>
        <h3 className="perm__modal-title">{isEdit ? 'Chỉnh sửa quyền' : 'Thêm quyền mới'}</h3>

        <label className="perm__form-label">
          URL Pattern <span className="perm__required">*</span>
          <span className="perm__form-hint">(bắt đầu bằng /)</span>
        </label>
        <input
          className="perm__form-input perm__form-input--code"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="/hocvien-portal"
          autoFocus
        />

        <label className="perm__form-label">Mô tả</label>
        <input
          className="perm__form-input"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="VD: Portal học viên"
        />

        <div className="perm__role-preview">
          <p className="perm__role-preview-title">Preview — sẽ match các request:</p>
          {previewMatches.map(m => (
            <code key={m} className="perm__role-preview-line">{m}</code>
          ))}
        </div>

        {error && <p className="perm__form-error">{error}</p>}

        <div className="perm__modal-footer">
          <button className="perm__btn perm__btn--ghost" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="perm__btn perm__btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Tạo quyền'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;
