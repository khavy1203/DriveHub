import { useState } from 'react';
import axios from '../../../axios';
import type { SyncResult } from '../types';

type ApiResponse = { EC: number; EM: string; DT: SyncResult };

export function useKQSHSync() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post<ApiResponse>('/api/admin/kqsh/sync');
      if (res.data.EC === 0) {
        setResult(res.data.DT);
      } else {
        setError(res.data.EM || 'Sync thất bại');
      }
    } catch {
      setError('Lỗi kết nối khi thực hiện sync');
    } finally {
      setSyncing(false);
    }
  };

  return { syncing, result, error, triggerSync };
}
