import { useCallback, useEffect, useState } from 'react';
import axios from '../../../axios';
import type { PermissionUsersResponse } from '../types';

type Filters = { page?: number; limit?: number; search?: string; groupId?: number | null };

export function usePermissionUsers(filters: Filters = {}) {
  const [data, setData] = useState<PermissionUsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(filters.page ?? 1),
        limit: String(filters.limit ?? 20),
      };
      if (filters.search) params.search = filters.search;
      if (filters.groupId) params.groupId = String(filters.groupId);

      const res = await axios.get<{ EC: number; DT: PermissionUsersResponse }>('/api/admin/permissions/users', { params });
      if (res.data.EC === 0) setData(res.data.DT);
      else setError('Không tải được danh sách người dùng');
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.search, filters.groupId]);

  useEffect(() => { fetch(); }, [fetch]);

  const setUserGroup = useCallback(async (userId: number, groupId: number) => {
    await axios.put(`/api/admin/permissions/users/${userId}/group`, { groupId });
    await fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, setUserGroup };
}
