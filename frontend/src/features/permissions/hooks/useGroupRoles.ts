import { useCallback, useState } from 'react';
import axios from '../../../axios';

export function useGroupRoles() {
  const [saving, setSaving] = useState(false);

  const setGroupRoles = useCallback(async (groupId: number, roleIds: number[]) => {
    setSaving(true);
    try {
      await axios.put(`/api/admin/permissions/groups/${groupId}/roles`, { roleIds });
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, setGroupRoles };
}
