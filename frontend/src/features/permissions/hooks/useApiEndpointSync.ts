import { useCallback, useState } from 'react';
import axios from '../../../axios';

export type SyncResult = { synced: number; updated: number; total: number };

export function useApiEndpointSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    setLastResult(null);
    try {
      const res = await axios.post<{ EC: number; DT: SyncResult }>('/api/admin/permissions/api-endpoints/sync');
      if (res.data.EC === 0 && res.data.DT) setLastResult(res.data.DT);
    } finally {
      setSyncing(false);
    }
  }, []);

  return { syncing, lastResult, sync };
}
