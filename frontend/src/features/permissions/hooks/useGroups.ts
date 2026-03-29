import { useCallback, useEffect, useState } from 'react';
import axios from '../../../axios';
import type { Group } from '../types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ EC: number; DT: Group[] }>('/api/admin/permissions/groups');
      if (res.data.EC === 0) setGroups(res.data.DT ?? []);
      else setError('Không tải được danh sách nhóm');
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createGroup = useCallback(async (payload: { name: string; description?: string; roleIds?: number[] }) => {
    await axios.post('/api/admin/permissions/groups', payload);
    await fetch();
  }, [fetch]);

  const updateGroup = useCallback(async (id: number, payload: { name?: string; description?: string }) => {
    await axios.put(`/api/admin/permissions/groups/${id}`, payload);
    await fetch();
  }, [fetch]);

  const deleteGroup = useCallback(async (id: number) => {
    await axios.delete(`/api/admin/permissions/groups/${id}`);
    await fetch();
  }, [fetch]);

  return { groups, loading, error, refetch: fetch, createGroup, updateGroup, deleteGroup };
}
