import React, { useState, useCallback, useDeferredValue } from 'react';
import GroupRoleMatrix from '../../../features/permissions/components/GroupRoleMatrix';
import RoleList from '../../../features/permissions/components/RoleList';
import UserGroupTable from '../../../features/permissions/components/UserGroupTable';
import GroupModal from '../../../features/permissions/components/GroupModal';
import RoleModal from '../../../features/permissions/components/RoleModal';
import { useGroups } from '../../../features/permissions/hooks/useGroups';
import { useRoles } from '../../../features/permissions/hooks/useRoles';
import { useGroupRoles } from '../../../features/permissions/hooks/useGroupRoles';
import { usePermissionUsers } from '../../../features/permissions/hooks/usePermissionUsers';
import type { Group, Role } from '../../../features/permissions/types';
import { ApiPermissionPanel } from '../../../features/permissions';
import './PermissionPage.scss';

type Tab = 'matrix' | 'roles' | 'users' | 'api';

const PermissionPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('matrix');

  const { groups, loading: groupsLoading, createGroup, updateGroup, deleteGroup, refetch: refetchGroups } = useGroups();
  const { roles, loading: rolesLoading, createRole, updateRole, deleteRole, refetch: refetchRoles } = useRoles();
  const { saving: savingRoles, setGroupRoles } = useGroupRoles();

  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersGroupFilter, setUsersGroupFilter] = useState<number | null>(null);
  const deferredSearch = useDeferredValue(usersSearch);

  const { data: usersData, loading: usersLoading, setUserGroup } = usePermissionUsers({
    page: usersPage,
    limit: 20,
    search: deferredSearch,
    groupId: usersGroupFilter,
  });

  const [groupModal, setGroupModal] = useState<{ open: boolean; group?: Group | null }>({ open: false });
  const [roleModal, setRoleModal] = useState<{ open: boolean; role?: Role | null }>({ open: false });
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const handleMatrixToggle = useCallback(async (group: Group, role: Role, checked: boolean) => {
    const current = group.roles?.map(r => r.id) ?? [];
    const newIds = checked ? [...current, role.id] : current.filter(id => id !== role.id);
    await setGroupRoles(group.id, newIds);
    await refetchGroups();
  }, [setGroupRoles, refetchGroups]);

  const handleDeleteGroup = (group: Group) => setDeletingGroup(group);

  const handleConfirmDeleteGroup = async () => {
    if (!deletingGroup) return;
    try {
      await deleteGroup(deletingGroup.id);
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleSaveGroup = async (payload: { name: string; description?: string; roleIds?: number[] }) => {
    if (groupModal.group) {
      await updateGroup(groupModal.group.id, payload);
    } else {
      await createGroup(payload);
    }
    await refetchRoles();
  };

  const handleSaveRole = async (payload: { url: string; description?: string }) => {
    if (roleModal.role) {
      await updateRole(roleModal.role.id, payload);
    } else {
      await createRole(payload);
    }
    await refetchGroups();
  };

  const handleDeleteRole = async (role: Role) => {
    await deleteRole(role.id);
    await refetchGroups();
  };

  const handleChangeUserGroup = async (user: import('../../../features/permissions/types').PermissionUser, groupId: number) => {
    await setUserGroup(user.id, groupId);
  };

  const handleUsersSearch = useCallback((v: string) => {
    setUsersSearch(v);
    setUsersPage(1);
  }, []);

  const handleUsersFilterGroup = useCallback((id: number | null) => {
    setUsersGroupFilter(id);
    setUsersPage(1);
  }, []);

  return (
    <div className="perm__page">
      <h1 className="perm__title">Quản lý Phân Quyền</h1>

      <div className="perm__tabs">
        <button
          className={`perm__tab ${tab === 'matrix' ? 'perm__tab--active' : ''}`}
          onClick={() => setTab('matrix')}
        >
          <i className="material-icons">grid_on</i> Nhóm &amp; Quyền
        </button>
        <button
          className={`perm__tab ${tab === 'roles' ? 'perm__tab--active' : ''}`}
          onClick={() => setTab('roles')}
        >
          <i className="material-icons">vpn_key</i> Danh sách Quyền
        </button>
        <button
          className={`perm__tab ${tab === 'users' ? 'perm__tab--active' : ''}`}
          onClick={() => setTab('users')}
        >
          <i className="material-icons">people</i> Người dùng
        </button>
        <button
          className={`perm__tab ${tab === 'api' ? 'perm__tab--active' : ''}`}
          onClick={() => setTab('api')}
        >
          <i className="material-icons">http</i> API &amp; Quyền
        </button>
      </div>

      <div className="perm__tab-content">
        {(groupsLoading || rolesLoading) && tab !== 'users' && tab !== 'api' && (
          <div className="perm__loading"><span className="perm__spinner" />Đang tải...</div>
        )}

        {tab === 'matrix' && !groupsLoading && !rolesLoading && (
          <GroupRoleMatrix
            groups={groups}
            roles={roles}
            onToggle={handleMatrixToggle}
            onAddGroup={() => setGroupModal({ open: true, group: null })}
            onAddRole={() => setRoleModal({ open: true, role: null })}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {tab === 'roles' && !rolesLoading && (
          <RoleList
            roles={roles}
            onAdd={() => setRoleModal({ open: true, role: null })}
            onEdit={role => setRoleModal({ open: true, role })}
            onDelete={handleDeleteRole}
          />
        )}

        {tab === 'api' && <ApiPermissionPanel />}

        {tab === 'users' && (
          <div>
            {usersLoading && <div className="perm__loading"><span className="perm__spinner" />Đang tải...</div>}
            <UserGroupTable
              users={usersData?.users ?? []}
              total={usersData?.total ?? 0}
              page={usersPage}
              limit={20}
              groups={groups}
              search={usersSearch}
              filterGroupId={usersGroupFilter}
              onSearch={handleUsersSearch}
              onFilterGroup={handleUsersFilterGroup}
              onPageChange={setUsersPage}
              onChangeGroup={handleChangeUserGroup}
            />
          </div>
        )}
      </div>

      {groupModal.open && (
        <GroupModal
          group={groupModal.group}
          roles={roles}
          onSave={handleSaveGroup}
          onClose={() => setGroupModal({ open: false })}
        />
      )}

      {roleModal.open && (
        <RoleModal
          role={roleModal.role}
          onSave={handleSaveRole}
          onClose={() => setRoleModal({ open: false })}
        />
      )}

      {deletingGroup && (
        <div className="perm__modal-overlay">
          <div className="perm__modal" onClick={e => e.stopPropagation()}>
            <h3 className="perm__modal-title">Xóa nhóm</h3>
            <p>Xóa nhóm <strong>{deletingGroup.name}</strong>? Thao tác này không thể hoàn tác.</p>
            <div className="perm__modal-footer">
              <button className="perm__btn perm__btn--ghost" onClick={() => setDeletingGroup(null)}>Huỷ</button>
              <button className="perm__btn perm__btn--danger" onClick={handleConfirmDeleteGroup}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionPage;
