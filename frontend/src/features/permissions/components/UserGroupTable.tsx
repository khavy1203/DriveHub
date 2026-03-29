import React, { useState } from 'react';
import type { Group, PermissionUser } from '../types';

const PROTECTED_EMAIL = 'admin@gmail.com';

const GROUP_COLOR_MAP: Record<string, string> = {
  supperadmin: 'supperadmin',
  admin: 'admin',
  giaovien: 'giaovien',
  hocvien: 'hocvien',
  khachhang: 'khachhang',
};

type Props = {
  users: PermissionUser[];
  total: number;
  page: number;
  limit: number;
  groups: Group[];
  search: string;
  filterGroupId: number | null;
  onSearch: (v: string) => void;
  onFilterGroup: (id: number | null) => void;
  onPageChange: (p: number) => void;
  onChangeGroup: (user: PermissionUser, newGroupId: number) => Promise<void>;
  currentUserId?: number;
};

const UserGroupTable: React.FC<Props> = ({
  users, total, page, limit, groups, search, filterGroupId,
  onSearch, onFilterGroup, onPageChange, onChangeGroup, currentUserId,
}) => {
  const [confirm, setConfirm] = useState<{ user: PermissionUser; newGroupId: number } | null>(null);
  const [changing, setChanging] = useState<number | null>(null);

  const totalPages = Math.ceil(total / limit);

  const groupName = (id: number) => groups.find(g => g.id === id)?.name ?? '';
  const colorKey = (name: string) => GROUP_COLOR_MAP[name.toLowerCase()] ?? 'khachhang';

  const handleSelectChange = (user: PermissionUser, newGroupId: number) => {
    if (newGroupId === user.groupId) return;
    setConfirm({ user, newGroupId });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setChanging(confirm.user.id);
    try {
      await onChangeGroup(confirm.user, confirm.newGroupId);
    } finally {
      setChanging(null);
      setConfirm(null);
    }
  };

  return (
    <div className="perm__user-table">
      <div className="perm__user-filters">
        <select
          className="perm__select"
          value={filterGroupId ?? ''}
          onChange={e => onFilterGroup(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Tất cả nhóm</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="perm__search-wrap">
          <i className="material-icons">search</i>
          <input
            className="perm__search"
            type="text"
            placeholder="Tìm email, tên..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </div>

      <table className="perm__table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Email</th>
            <th>Nhóm hiện tại</th>
            <th>Đổi nhóm</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={4} className="perm__empty">Không có người dùng nào</td></tr>
          )}
          {users.map(user => {
            const isProtected = user.email === PROTECTED_EMAIL || user.id === currentUserId;
            const isChanging = changing === user.id;
            const name = groupName(user.groupId);

            return (
              <tr key={user.id}>
                <td>{user.username || '—'}</td>
                <td className="perm__email-cell">
                  {user.email}
                  {user.email === PROTECTED_EMAIL && (
                    <span className="perm__system-badge" title="Tài khoản hệ thống, không thể thay đổi">
                      <i className="material-icons">lock</i>
                    </span>
                  )}
                </td>
                <td>
                  <span className={`perm__group-badge perm__group-badge--${colorKey(name)}`}>{name}</span>
                </td>
                <td>
                  {isProtected ? (
                    <span className="perm__locked-label">
                      {user.id === currentUserId ? '(chính mình)' : '— Khoá —'}
                    </span>
                  ) : (
                    <select
                      className="perm__select perm__select--inline"
                      value={user.groupId}
                      disabled={isChanging}
                      onChange={e => handleSelectChange(user, Number(e.target.value))}
                    >
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="perm__pagination">
          <button
            className="perm__page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <i className="material-icons">chevron_left</i>
          </button>
          <span className="perm__page-info">Trang {page} / {totalPages} ({total} người dùng)</span>
          <button
            className="perm__page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <i className="material-icons">chevron_right</i>
          </button>
        </div>
      )}

      {confirm && (
        <div className="perm__modal-overlay" onClick={() => setConfirm(null)}>
          <div className="perm__modal" onClick={e => e.stopPropagation()}>
            <h3 className="perm__modal-title">Xác nhận đổi nhóm</h3>
            <p>
              Đổi nhóm của <strong>{confirm.user.username || confirm.user.email}</strong> sang{' '}
              <strong>{groupName(confirm.newGroupId)}</strong>?
            </p>
            <p className="perm__modal-note">
              <i className="material-icons">info</i>
              Người dùng cần đăng nhập lại để có quyền mới.
            </p>
            <div className="perm__modal-footer">
              <button className="perm__btn perm__btn--ghost" onClick={() => setConfirm(null)}>Huỷ</button>
              <button className="perm__btn perm__btn--primary" onClick={handleConfirm}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGroupTable;
