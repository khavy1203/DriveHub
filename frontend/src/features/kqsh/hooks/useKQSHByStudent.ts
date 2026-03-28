import { useEffect, useState } from 'react';
import axios from '../../../axios';
import type { KQSHResponse } from '../types';

export function useKQSHByStudent(hocVienId: number | null, role: 'admin' | 'teacher') {
  const [data, setData] = useState<KQSHResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hocVienId) return;
    const path =
      role === 'admin'
        ? `/api/hocvien/${hocVienId}/kqsh`
        : `/api/teacher/students/${hocVienId}/kqsh`;

    setLoading(true);
    setData(null);
    setError(null);

    axios
      .get<{ EC: number; DT: KQSHResponse | null }>(path)
      .then(res => {
        if (res.data.EC === 0) setData(res.data.DT);
        else setError('Không tải được dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [hocVienId, role]);

  return { data, loading, error };
}
