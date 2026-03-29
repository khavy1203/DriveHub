import { useCallback, useEffect, useState } from 'react';
import axios from '../../../axios';
import type { Role } from '../types';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ EC: number; DT: Role[] }>('/api/admin/permissions/roles');
      if (res.data.EC === 0) setRoles(res.data.DT ?? []);
      else setError('Không tải được danh sách quyền');
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createRole = useCallback(async (payload: { url: string; description?: string }) => {
    await axios.post('/api/admin/permissions/roles', payload);
    await fetch();
  }, [fetch]);

  const updateRole = useCallback(async (id: number, payload: { url?: string; description?: string }) => {
    await axios.put(`/api/admin/permissions/roles/${id}`, payload);
    await fetch();
  }, [fetch]);

  const deleteRole = useCallback(async (id: number) => {
    await axios.delete(`/api/admin/permissions/roles/${id}`);
    await fetch();
  }, [fetch]);

  return { roles, loading, error, refetch: fetch, createRole, updateRole, deleteRole };
}
