import { useCallback, useEffect, useState } from 'react';
import axios from '../../../axios';
import type { GroupApiMatrix } from '../types';

export function useGroupApiMatrix() {
  const [data, setData] = useState<GroupApiMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ EC: number; DT: GroupApiMatrix }>('/api/admin/permissions/group-api');
      if (res.data.EC === 0) setData(res.data.DT);
      else setError('Không tải được ma trận API');
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const setGroupApis = useCallback(
    async (groupId: number, apiEndpointIds: number[]) => {
      await axios.put('/api/admin/permissions/group-api', { groupId, apiEndpointIds });
      await fetch();
    },
    [fetch],
  );

  return { data, loading, error, refetch: fetch, setGroupApis };
}
