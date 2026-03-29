import React, { useCallback, useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import axiosInstance from '../../../axios';
import { isRecord, type TrainingApiResponse } from '../types';
import { parseTrainingDisplay } from '../lib/parseTrainingDisplay';
import TrainingFullStudentView from './TrainingFullStudentView';
import './TrainingProgressBlock.scss';

type Props = {
  /** Học viên: gọi API không kèm cccd (server dùng CCCD trong hồ sơ). Staff: bắt buộc truyền cccd. */
  mode: 'student' | 'staff';
  cccd?: string | null;
  /** Ẩn breadcrumb khi nhúng trong drawer / card portal. */
  compact?: boolean;
  className?: string;
};

const TrainingProgressBlock: React.FC<Props> = ({
  mode,
  cccd,
  compact = false,
  className,
}) => {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<TrainingApiResponse | null>(null);
  const [httpError, setHttpError] = useState<string | null>(null);

  const trimmedCccd = cccd?.trim() ?? '';
  const skipForMissingCccd = mode === 'staff' && !trimmedCccd;

  const load = useCallback(async () => {
    if (skipForMissingCccd) {
      setLoading(false);
      setPayload(null);
      setHttpError(null);
      return;
    }
    setLoading(true);
    setHttpError(null);
    try {
      const res = await axiosInstance.get<TrainingApiResponse>('/api/training/student-cached', {
        params: mode === 'staff' && trimmedCccd ? { cccd: trimmedCccd } : {},
      });
      setPayload(res.data);
    } catch (e: unknown) {
      setPayload(null);
      const msg =
        isAxiosError(e) && e.response?.data && isRecord(e.response.data as unknown)
          ? String((e.response.data as Record<string, unknown>).EM ?? 'Lỗi tải dữ liệu')
          : 'Lỗi tải dữ liệu';
      setHttpError(msg);
    } finally {
      setLoading(false);
    }
  }, [mode, skipForMissingCccd, trimmedCccd]);

  useEffect(() => {
    void load();
  }, [load]);

  const rootClass = ['tpb', className].filter(Boolean).join(' ');

  if (skipForMissingCccd) {
    return (
      <div className={rootClass}>
        <p className="tpb__muted">Chưa có số CCCD trên hồ sơ — không thể tra cứu tiến độ hệ đào tạo.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={rootClass}>
        <div className="tpb__loading">
          <span className="material-icons tpb__spin">sync</span>
          <span>Đang tải tiến độ đào tạo...</span>
        </div>
      </div>
    );
  }

  if (httpError) {
    return (
      <div className={rootClass}>
        <p className="tpb__error">{httpError}</p>
        <button type="button" className="tpb__retry" onClick={() => void load()}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className={rootClass}>
        <p className="tpb__muted">Không có dữ liệu.</p>
      </div>
    );
  }

  if (payload.EC !== 0) {
    return (
      <div className={rootClass}>
        <p className="tpb__error">{payload.EM || 'Không lấy được dữ liệu'}</p>
        <button type="button" className="tpb__retry" onClick={() => void load()}>
          Thử lại
        </button>
      </div>
    );
  }

  const dt = payload.DT;
  if (!isRecord(dt)) {
    return (
      <div className={rootClass}>
        <p className="tpb__muted">Dữ liệu không đúng định dạng.</p>
      </div>
    );
  }

  const display = parseTrainingDisplay(dt);

  return (
    <div className={rootClass}>
      <TrainingFullStudentView
        display={display}
        showBreadcrumbs={!compact}
      />
    </div>
  );
};

export default TrainingProgressBlock;
