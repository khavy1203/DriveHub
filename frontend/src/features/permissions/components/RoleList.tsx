import React, { useState } from 'react';
import type { Role } from '../types';

type Props = {
  roles: Role[];
  onAdd: () => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
};

const RoleList: React.FC<Props> = ({ roles, onAdd, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);

  const handleDelete = (role: Role) => {
    const usedByGroups = role.groups?.length ?? 0;
    if (usedByGroups > 0) {
      setConfirmDelete(role);
    } else {
      onDelete(role);
    }
  };

  return (
    <div className="perm__role-list">
      <div className="perm__role-list-header">
        <button className="perm__btn perm__btn--primary" onClick={onAdd}>
          <i className="material-icons">add</i> Thêm quyền mới
        </button>
      </div>

      <table className="perm__table">
        <thead>
          <tr>
            <th>#</th>
            <th>URL Pattern</th>
            <th>Mô tả</th>
            <th>Nhóm đang dùng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 && (
            <tr><td colSpan={5} className="perm__empty">Chưa có quyền nào</td></tr>
          )}
          {roles.map((role, idx) => (
            <tr key={role.id}>
              <td className="perm__table-idx">{idx + 1}</td>
              <td>
                <code className="perm__role-url-lg">{role.url}</code>
              </td>
              <td className="perm__table-desc">{role.description || '—'}</td>
              <td>
                <div className="perm__group-tags">
                  {(role.groups ?? []).length === 0 && <span className="perm__no-groups">Chưa gán</span>}
                  {(role.groups ?? []).map(g => (
                    <span key={g.id} className={`perm__group-badge perm__group-badge--${g.name.toLowerCase()}`}>
                      {g.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="perm__table-actions">
                <button
                  className="perm__icon-btn"
                  title="Chỉnh sửa"
                  onClick={() => onEdit(role)}
                >
                  <i className="material-icons">edit</i>
                </button>
                <button
                  className="perm__icon-btn perm__icon-btn--danger"
                  title="Xóa"
                  onClick={() => handleDelete(role)}
                >
                  <i className="material-icons">delete</i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDelete && (
        <div className="perm__modal-overlay">
          <div className="perm__modal" onClick={e => e.stopPropagation()}>
            <h3 className="perm__modal-title">Xác nhận xóa quyền</h3>
            <p>
              Quyền <strong>{confirmDelete.url}</strong> đang được gán cho{' '}
              <strong>{confirmDelete.groups?.length} nhóm</strong>. Xóa sẽ gỡ quyền này khỏi tất cả nhóm.
            </p>
            <div className="perm__modal-footer">
              <button className="perm__btn perm__btn--ghost" onClick={() => setConfirmDelete(null)}>Huỷ</button>
              <button
                className="perm__btn perm__btn--danger"
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleList;
