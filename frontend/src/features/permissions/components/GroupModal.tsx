import React, { useEffect, useState } from 'react';
import type { Group, Role } from '../types';

type Props = {
  group?: Group | null;
  roles: Role[];
  onSave: (payload: { name: string; description?: string; roleIds?: number[] }) => Promise<void>;
  onClose: () => void;
};

const GroupModal: React.FC<Props> = ({ group, roles, onSave, onClose }) => {
  const isEdit = !!group;
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    group?.roles?.map(r => r.id) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(group?.name ?? '');
    setDescription(group?.description ?? '');
    setSelectedRoles(group?.roles?.map(r => r.id) ?? []);
    setError('');
  }, [group]);

  const toggleRole = (id: number) =>
    setSelectedRoles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Tên nhóm không được để trống'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, roleIds: selectedRoles });
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
        <h3 className="perm__modal-title">{isEdit ? 'Chỉnh sửa nhóm' : 'Thêm nhóm mới'}</h3>

        <label className="perm__form-label">
          Tên nhóm <span className="perm__required">*</span>
        </label>
        <input
          className="perm__form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="VD: KhachHang"
          autoFocus
        />

        <label className="perm__form-label">Mô tả</label>
        <input
          className="perm__form-input"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về nhóm"
        />

        <label className="perm__form-label">Quyền truy cập</label>
        <div className="perm__role-checklist">
          {roles.length === 0 && <span className="perm__empty">Chưa có quyền nào. Tạo quyền trước.</span>}
          {roles.map(role => (
            <label key={role.id} className="perm__role-check-item">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
              <code>{role.url}</code>
              {role.description && <span className="perm__role-check-desc">— {role.description}</span>}
            </label>
          ))}
        </div>

        {error && <p className="perm__form-error">{error}</p>}

        <div className="perm__modal-footer">
          <button className="perm__btn perm__btn--ghost" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="perm__btn perm__btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
