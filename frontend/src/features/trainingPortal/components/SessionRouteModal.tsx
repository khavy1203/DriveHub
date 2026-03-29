import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axiosInstance from '../../../axios';
import type { TrainingSessionRow } from '../lib/parseTrainingDisplay';
import './SessionRouteModal.scss';

type GpsPoint = { lat: number; lng: number; thoiGian: string };

type SessionDetailDT = {
  phien: {
    maDK: string;
    ngay: string;
    thoiDiemDangNhap: string;
    thoiDiemDangXuat: string;
    thoiLuong: string;
  };
  tomTat: {
    soDiemGPS: number;
    kmUocTinh: number;
    tocDoTrungBinhKmh: number;
    thoiGianDiemDau: string;
    thoiGianDiemCuoi: string;
  };
  loTrinh: GpsPoint[];
};

type Props = {
  session: TrainingSessionRow;
  maDK: string | null;
  studentName: string;
  onClose: () => void;
};

/**
 * Extract YYYY-MM-DD from an ISO string without Date() to avoid UTC+7 locale shifts.
 * "2026-03-08T18:15:11.000Z" → "2026-03-08"
 */
const extractNgay = (iso: string): string => {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : iso.slice(0, 10);
};

/**
 * Extract HH:MM:SS from an ISO string without Date() to avoid UTC+7 locale shifts.
 * "2026-03-08T18:15:11.000Z" → "18:15:11"
 */
const extractTime = (iso: string): string => {
  const m = iso.match(/T(\d{2}:\d{2}:\d{2})/);
  if (m) return m[1];
  const m2 = iso.match(/(\d{2}:\d{2}:\d{2})/);
  return m2 ? m2[1] : iso;
};

/**
 * Show HH:MM:SS from ISO or bare time string — always reads the literal digits, no timezone shift.
 * "2025-06-11T07:44:23" → "07:44:23" | "07:44:23" → "07:44:23"
 */
const formatTimeSm = (isoOrTime: string): string => {
  const m = isoOrTime.match(/T(\d{2}:\d{2}:\d{2})/) || isoOrTime.match(/^(\d{2}:\d{2}:\d{2})/);
  return m ? m[1] : isoOrTime.slice(0, 8);
};

const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || points.length < 2) return;
    map.fitBounds(points, { padding: [32, 32] });
    fitted.current = true;
  }, [map, points]);
  return null;
};

const TEAL = '#00685d';
const RED = '#ba1a1a';

type LoadState = 'idle' | 'loading' | 'ok' | 'error';

const SessionRouteModal: React.FC<Props> = ({ session, maDK, studentName, onClose }) => {
  const [state, setState] = useState<LoadState>('idle');
  const [data, setData] = useState<SessionDetailDT | null>(null);
  const [errMsg, setErrMsg] = useState<string>('');

  useEffect(() => {
    if (!session.thoiDiemVao || !session.thoiDiemRa) {
      setState('error');
      setErrMsg('Phiên học này không có dữ liệu thời gian để tra cứu lộ trình.');
      return;
    }

    setState('loading');
    const ngay = extractNgay(session.thoiDiemVao);
    const thoiDiemDangNhap = extractTime(session.thoiDiemVao);
    const thoiDiemDangXuat = extractTime(session.thoiDiemRa);

    const params: Record<string, string> = { ngay, thoiDiemDangNhap, thoiDiemDangXuat };
    if (maDK && maDK !== '—') params.maDK = maDK;
    // For HocVien: backend resolves CCCD from JWT — no extra param needed

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

  const positions: [number, number][] = (data?.loTrinh ?? []).map((p) => [p.lat, p.lng]);
  const center: [number, number] = positions.length > 0 ? positions[Math.floor(positions.length / 2)] : [10.762622, 106.660172];

  const tomTat = data?.tomTat;
  const phien = data?.phien;

  const timelinePoints: GpsPoint[] = (() => {
    if (!data?.loTrinh || data.loTrinh.length === 0) return [];
    const pts = data.loTrinh;
    if (pts.length <= 5) return pts;
    const step = Math.floor((pts.length - 2) / 3);
    return [pts[0], pts[step], pts[step * 2], pts[step * 3], pts[pts.length - 1]];
  })();

  return (
    <div className="srm__overlay" onClick={onClose} role="dialog" aria-modal="true">
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
                <MapContainer center={center} zoom={14} className="srm__map" zoomControl={false}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {positions.length >= 2 && (
                    <>
                      <Polyline positions={positions} color={TEAL} weight={4} opacity={0.85} />
                      <CircleMarker center={positions[0]} radius={9} fillColor={TEAL} color="white" weight={2} fillOpacity={1}>
                        <Tooltip permanent direction="top" offset={[0, -12]} className="srm__map-tooltip">
                          BẮT ĐẦU
                        </Tooltip>
                      </CircleMarker>
                      <CircleMarker center={positions[positions.length - 1]} radius={9} fillColor={RED} color="white" weight={2} fillOpacity={1}>
                        <Tooltip permanent direction="top" offset={[0, -12]} className="srm__map-tooltip srm__map-tooltip--end">
                          KẾT THÚC
                        </Tooltip>
                      </CircleMarker>
                    </>
                  )}
                  {positions.length >= 2 && <FitBounds points={positions} />}
                </MapContainer>

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
                    <p className="srm__stat-label">Quãng đường ước tính</p>
                    <p className="srm__stat-value">{tomTat ? `${tomTat.kmUocTinh.toFixed(2)} km` : session.distanceLabel}</p>
                  </div>
                </div>
                <div className="srm__stat-card">
                  <span className="material-icons srm__stat-icon">timer</span>
                  <div>
                    <p className="srm__stat-label">Thời lượng</p>
                    <p className="srm__stat-value">{phien?.thoiLuong ?? session.durationLabel}</p>
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
                    <p className="srm__info-metric-val">{tomTat ? `${tomTat.kmUocTinh.toFixed(2)} km` : session.distanceLabel}</p>
                  </div>
                  <div className="srm__info-metric">
                    <p className="srm__info-metric-label">Thời lượng</p>
                    <p className="srm__info-metric-val">{phien?.thoiLuong ?? session.durationLabel}</p>
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
    </div>
  );
};

export default SessionRouteModal;
