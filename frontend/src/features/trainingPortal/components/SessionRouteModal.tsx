import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../../axios';
import type { TrainingSessionRow } from '../lib/parseTrainingDisplay';
import './SessionRouteModal.scss';

const LazyMap = lazy(() => import('./SessionRouteMap'));

type GpsPoint = { lat: number; lng: number; thoiGian: string };

type ComputedSummary = {
  soDiemGPS: number;
  kmGPS: number;
  tocDoTrungBinhKmh: number;
  thoiGianDiemDau: string;
  thoiGianDiemCuoi: string;
};

type SessionDetailDT = {
  loTrinh: GpsPoint[];
};

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MAX_GAP_MS = 120_000;

/**
 * Fast ms-since-epoch from "YYYY-MM-DDTHH:MM:SS" without constructing Date objects.
 * Treats the timestamp as UTC (consistent with the API format).
 */
const fastParseMs = (s: string): number => {
  const y = (s.charCodeAt(0) - 48) * 1000 + (s.charCodeAt(1) - 48) * 100 + (s.charCodeAt(2) - 48) * 10 + (s.charCodeAt(3) - 48);
  const mo = (s.charCodeAt(5) - 48) * 10 + (s.charCodeAt(6) - 48);
  const d = (s.charCodeAt(8) - 48) * 10 + (s.charCodeAt(9) - 48);
  const h = (s.charCodeAt(11) - 48) * 10 + (s.charCodeAt(12) - 48);
  const mi = (s.charCodeAt(14) - 48) * 10 + (s.charCodeAt(15) - 48);
  const sec = (s.charCodeAt(17) - 48) * 10 + (s.charCodeAt(18) - 48);
  return Date.UTC(y, mo - 1, d, h, mi, sec);
};

const computeSummary = (points: GpsPoint[]): ComputedSummary | null => {
  if (points.length === 0) return null;
  let totalKm = 0;
  let drivingMs = 0;
  let prevMs = fastParseMs(points[0].thoiGian);
  for (let i = 1; i < points.length; i++) {
    const curMs = fastParseMs(points[i].thoiGian);
    const gap = curMs - prevMs;
    if (gap > 0 && gap <= MAX_GAP_MS) {
      totalKm += haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
      drivingMs += gap;
    }
    prevMs = curMs;
  }
  const drivingH = drivingMs / 3_600_000;
  return {
    soDiemGPS: points.length,
    kmGPS: Math.round(totalKm * 100) / 100,
    tocDoTrungBinhKmh: drivingH > 0 ? Math.round((totalKm / drivingH) * 10) / 10 : 0,
    thoiGianDiemDau: points[0].thoiGian,
    thoiGianDiemCuoi: points[points.length - 1].thoiGian,
  };
};

type Props = {
  session: TrainingSessionRow;
  maDK: string | null;
  studentName: string;
  onClose: () => void;
};

const toApiNgay = (ddmmyyyy: string | null, isoFallback: string): string => {
  if (ddmmyyyy) {
    const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  }
  const m = isoFallback.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : isoFallback.slice(0, 10);
};

const parseGioDaoTao = (gioDaoTao: string | null): [string, string] | null => {
  if (!gioDaoTao) return null;
  const m = gioDaoTao.match(/(\d{1,2}:\d{2})\s*[–\-]\s*(\d{1,2}:\d{2})/);
  if (!m) return null;
  const pad = (t: string) => {
    const [h, min] = t.split(':');
    return `${h.padStart(2, '0')}:${min}:00`;
  };
  return [pad(m[1]), pad(m[2])];
};

const extractTime = (iso: string): string => {
  const m = iso.match(/T(\d{2}:\d{2}:\d{2})/);
  if (m) return m[1];
  const m2 = iso.match(/(\d{2}:\d{2}:\d{2})/);
  return m2 ? m2[1] : iso;
};

const formatTimeSm = (isoOrTime: string): string => {
  const m = isoOrTime.match(/T(\d{2}:\d{2}:\d{2})/) || isoOrTime.match(/^(\d{2}:\d{2}:\d{2})/);
  return m ? m[1] : isoOrTime.slice(0, 8);
};

const MapSpinner: React.FC = () => (
  <div className="srm__map-loading">
    <div className="srm__spinner" />
    <p>Đang tải bản đồ...</p>
  </div>
);

const SessionRouteModal: React.FC<Props> = ({ session, maDK, studentName, onClose }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [data, setData] = useState<SessionDetailDT | null>(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!session.thoiDiemVao || !session.thoiDiemRa) {
      setState('error');
      setErrMsg('Phiên học này không có dữ liệu thời gian để tra cứu lộ trình.');
      return;
    }

    setState('loading');

    const localTimes = parseGioDaoTao(session.gioDaoTao);
    const ngay = toApiNgay(session.ngayDaoTao, session.thoiDiemVao);
    const thoiDiemDangNhap = localTimes ? localTimes[0] : extractTime(session.thoiDiemVao);
    const thoiDiemDangXuat = localTimes ? localTimes[1] : extractTime(session.thoiDiemRa);

    const params: Record<string, string> = { ngay, thoiDiemDangNhap, thoiDiemDangXuat };
    if (maDK && maDK !== '—') params.maDK = maDK;

    axiosInstance
      .get('/api/training/session-detail', { params })
      .then((res) => {
        if (res.data?.EC === 0 && res.data?.DT) {
          setData(res.data.DT as SessionDetailDT);
          setState('ok');
        } else {
          setErrMsg(res.data?.EM || 'Không tìm thấy dữ liệu lộ trình.');
          setState('error');
        }
      })
      .catch((err) => {
        setErrMsg(err?.response?.data?.EM || err?.message || 'Lỗi kết nối.');
        setState('error');
      });
  }, [session, maDK]);

  const points = data?.loTrinh ?? [];

  const positions = useMemo<[number, number][]>(
    () => points.map((p) => [p.lat, p.lng]),
    [points],
  );

  const center = useMemo<[number, number]>(
    () => positions.length > 0 ? positions[Math.floor(positions.length / 2)] : [10.762622, 106.660172],
    [positions],
  );

  const tomTat = useMemo(() => (data ? computeSummary(points) : null), [data, points]);

  const timelinePoints = useMemo<GpsPoint[]>(() => {
    if (points.length === 0) return [];
    if (points.length <= 5) return points;
    const step = Math.floor((points.length - 2) / 3);
    return [points[0], points[step], points[step * 2], points[step * 3], points[points.length - 1]];
  }, [points]);

  return createPortal(
    <div className="srm__overlay" role="dialog" aria-modal="true">
      <div className="srm__panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="srm__header">
          <div className="srm__header-left">
            <button className="srm__back-btn" onClick={onClose} aria-label="Đóng">
              <span className="material-icons">arrow_back</span>
            </button>
            <div>
              <h2 className="srm__title">
                Lộ trình phiên — {session.date}
              </h2>
              <p className="srm__subtitle">
                <span className="material-icons" style={{ fontSize: 14 }}>person</span>
                {studentName}
                <span className="srm__divider">|</span>
                <span className="material-icons" style={{ fontSize: 14 }}>schedule</span>
                {session.timeRange}
              </p>
            </div>
          </div>
          <button className="srm__close-btn" onClick={onClose} aria-label="Đóng modal">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body */}
        {state === 'loading' && (
          <div className="srm__loading">
            <div className="srm__spinner" />
            <p>Đang tải lộ trình...</p>
          </div>
        )}

        {state === 'error' && (
          <div className="srm__error">
            <span className="material-icons">error_outline</span>
            <p>{errMsg}</p>
          </div>
        )}

        {state === 'ok' && (
          <div className="srm__body">
            {/* Left: map */}
            <div className="srm__map-col">
              <div className="srm__map-wrap">
                <Suspense fallback={<MapSpinner />}>
                  <LazyMap positions={positions} center={center} />
                </Suspense>

                {/* Stats overlay on map */}
                {tomTat && (
                  <div className="srm__map-stats">
                    <div className="srm__map-stat">
                      <span className="srm__map-stat-label">Tốc độ TB</span>
                      <span className="srm__map-stat-value">{tomTat.tocDoTrungBinhKmh.toFixed(1)} km/h</span>
                    </div>
                    <div className="srm__map-stat-divider" />
                    <div className="srm__map-stat">
                      <span className="srm__map-stat-label">Điểm GPS</span>
                      <span className="srm__map-stat-value">{tomTat.soDiemGPS}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary stats row */}
              <div className="srm__stats-row">
                <div className="srm__stat-card">
                  <span className="material-icons srm__stat-icon">straighten</span>
                  <div>
                    <p className="srm__stat-label">Quãng đường</p>
                    <p className="srm__stat-value">{session.distanceLabel}</p>
                    {tomTat && <p className="srm__stat-sub">GPS: {tomTat.kmGPS.toFixed(2)} km</p>}
                  </div>
                </div>
                <div className="srm__stat-card">
                  <span className="material-icons srm__stat-icon">timer</span>
                  <div>
                    <p className="srm__stat-label">Thời lượng</p>
                    <p className="srm__stat-value">{session.durationLabel}</p>
                  </div>
                </div>
                <div className="srm__stat-card">
                  <span className="material-icons srm__stat-icon">directions_car</span>
                  <div>
                    <p className="srm__stat-label">Biển số xe</p>
                    <p className="srm__stat-value">{session.plate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: info + timeline */}
            <div className="srm__right-col">
              {/* Session info card */}
              <div className="srm__info-card">
                <h3 className="srm__info-title">Thông số phiên học</h3>
                <div className="srm__info-grid">
                  <div className="srm__info-metric">
                    <p className="srm__info-metric-label">Quãng đường</p>
                    <p className="srm__info-metric-val">{session.distanceLabel}</p>
                    {tomTat && <p className="srm__info-metric-sub">GPS: {tomTat.kmGPS.toFixed(2)} km</p>}
                  </div>
                  <div className="srm__info-metric">
                    <p className="srm__info-metric-label">Thời lượng</p>
                    <p className="srm__info-metric-val">{session.durationLabel}</p>
                  </div>
                </div>
                <div className="srm__info-rows">
                  <div className="srm__info-row">
                    <span className="srm__info-row-label">
                      <span className="material-icons">schedule</span>Bắt đầu:
                    </span>
                    <span className="srm__info-row-val">
                      {tomTat ? formatTimeSm(tomTat.thoiGianDiemDau) : session.thoiDiemVao ? extractTime(session.thoiDiemVao) : '—'}
                    </span>
                  </div>
                  <div className="srm__info-row">
                    <span className="srm__info-row-label">
                      <span className="material-icons">timer_off</span>Kết thúc:
                    </span>
                    <span className="srm__info-row-val">
                      {tomTat ? formatTimeSm(tomTat.thoiGianDiemCuoi) : session.thoiDiemRa ? extractTime(session.thoiDiemRa) : '—'}
                    </span>
                  </div>
                  <div className="srm__info-row">
                    <span className="srm__info-row-label">
                      <span className="material-icons">speed</span>Tốc độ TB:
                    </span>
                    <span className="srm__info-row-val">
                      {tomTat ? `${tomTat.tocDoTrungBinhKmh.toFixed(1)} km/h` : '—'}
                    </span>
                  </div>
                  <div className="srm__info-row">
                    <span className="srm__info-row-label">
                      <span className="material-icons">satellite_alt</span>Điểm GPS:
                    </span>
                    <span className="srm__info-row-val">{tomTat?.soDiemGPS ?? '—'}</span>
                  </div>
                </div>
              </div>

              {/* GPS Timeline */}
              <div className="srm__timeline-card">
                <h3 className="srm__info-title">Mốc thời gian (GPS)</h3>
                <div className="srm__timeline">
                  {timelinePoints.map((pt, i) => {
                    const isFirst = i === 0;
                    const isLast = i === timelinePoints.length - 1;
                    return (
                      <div key={`${pt.thoiGian}-${i}`} className={`srm__tl-item ${isFirst ? 'srm__tl-item--start' : isLast ? 'srm__tl-item--end' : ''}`}>
                        <div className="srm__tl-dot-wrap">
                          <div className={`srm__tl-dot ${isFirst ? 'srm__tl-dot--start' : isLast ? 'srm__tl-dot--end' : ''}`} />
                          {!isLast && <div className="srm__tl-line" />}
                        </div>
                        <div className="srm__tl-content">
                          <p className={`srm__tl-time ${isFirst ? 'srm__tl-time--start' : isLast ? 'srm__tl-time--end' : ''}`}>
                            {formatTimeSm(pt.thoiGian)}{isFirst ? ' — BẮT ĐẦU' : isLast ? ' — KẾT THÚC' : ''}
                          </p>
                          <p className="srm__tl-coords">{pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default SessionRouteModal;
