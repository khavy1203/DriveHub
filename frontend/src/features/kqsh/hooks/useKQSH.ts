import { useEffect, useState } from 'react';
import axios from '../../../axios';
import type { KQSHResponse } from '../types';

type ApiResponse = { EC: number; EM: string; DT: KQSHResponse | null };

export function useKQSH() {
  const [data, setData] = useState<KQSHResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<ApiResponse>('/api/student-portal/ket-qua-sat-hanh')
      .then((res) => {
        if (res.data.EC === 0) setData(res.data.DT);
        else setError(res.data.EM || 'Lỗi tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối máy chủ'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
