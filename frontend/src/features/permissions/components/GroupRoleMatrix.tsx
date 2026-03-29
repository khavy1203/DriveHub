import React, { useState } from 'react';
import type { Group, Role } from '../types';

type Props = {
  groups: Group[];
  roles: Role[];
  onToggle: (group: Group, role: Role, newChecked: boolean) => Promise<void>;
  onAddGroup: () => void;
  onAddRole: () => void;
  onDeleteGroup: (group: Group) => void;
};

const GroupRoleMatrix: React.FC<Props> = ({ groups, roles, onToggle, onAddGroup, onAddRole, onDeleteGroup }) => {
  const [toggling, setToggling] = useState<string | null>(null);

  const isChecked = (group: Group, role: Role) =>
    group.roles?.some(r => r.id === role.id) ?? false;

  const handleToggle = async (group: Group, role: Role) => {
    const key = `${group.id}-${role.id}`;
    if (toggling === key) return;
    setToggling(key);
    try {
      await onToggle(group, role, !isChecked(group, role));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="perm__matrix-wrap">
      <div className="perm__warning-banner">
        <i className="material-icons">warning_amber</i>
        <span>Thay đổi phân quyền chỉ có hiệu lực sau khi người dùng <strong>đăng nhập lại</strong>.</span>
      </div>

      <div className="perm__matrix-scroll">
        <table className="perm__matrix">
          <thead>
            <tr>
              <th className="perm__matrix-corner">Nhóm</th>
              {roles.map(role => (
                <th key={role.id} className="perm__matrix-role-header">
                  <div className="perm__role-header-inner" title={role.description || role.url}>
                    <code className="perm__role-url">{role.url}</code>
                    {role.description && (
                      <span className="perm__role-desc">{role.description}</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="perm__matrix-actions-header"></th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id} className="perm__matrix-row">
                <td className="perm__matrix-group-cell">
                  <div className="perm__group-cell-inner">
                    <span className="perm__group-name">{group.name}</span>
                    <span className="perm__group-count">{group.userCount} thành viên</span>
                  </div>
                </td>
                {roles.map(role => {
                  const key = `${group.id}-${role.id}`;
                  const checked = isChecked(group, role);
                  return (
                    <td key={role.id} className="perm__matrix-cell">
                      <label className="perm__checkbox-label" title={`${group.name} — ${role.url}`}>
                        <input
                          type="checkbox"
                          className="perm__checkbox"
                          checked={checked}
                          disabled={toggling === key}
                          onChange={() => handleToggle(group, role)}
                        />
                        <span className={`perm__checkbox-custom ${toggling === key ? 'perm__checkbox-custom--loading' : ''}`} />
                      </label>
                    </td>
                  );
                })}
                <td className="perm__matrix-row-actions">
                  {group.id > 5 && (
                    <button
                      className="perm__icon-btn perm__icon-btn--danger"
                      title="Xóa nhóm"
                      onClick={() => onDeleteGroup(group)}
                    >
                      <i className="material-icons">delete</i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="perm__matrix-footer">
        <button className="perm__btn perm__btn--outline" onClick={onAddGroup}>
          <i className="material-icons">add</i> Thêm nhóm
        </button>
        <button className="perm__btn perm__btn--outline" onClick={onAddRole}>
          <i className="material-icons">add</i> Thêm quyền
        </button>
      </div>
    </div>
  );
};

export default GroupRoleMatrix;
