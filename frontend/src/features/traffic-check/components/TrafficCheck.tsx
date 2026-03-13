import React, { useEffect, useState } from 'react';
import './TrafficCheck.scss';
import { TRAFFIC_BASE_URL } from 'src/core/constants/config';
import { useApi } from 'src/shared/hooks';
import { getConfig } from 'src/core/config/environment';

// ─── types ───────────────────────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { value: '1', label: 'Xe ô tô',      icon: 'airport_shuttle' },
  { value: '2', label: 'Xe máy',        icon: 'two_wheeler' },
  { value: '3', label: 'Xe máy điện',   icon: 'electric_bike' },
];

interface GplxRecord {
  id: number;
  ma_dang_ky: string;
  ho_ten: string;
  ngay_sinh: string;
  so_cmnd_cccd: string;
  so_gplx: string;
  hang: string;
  ket_qua_xac_thuc: string;
  ly_do_tu_choi: string;
  live?: {
    so_gplx?: string;
    ho_va_ten?: string;
    ngay_sinh?: string;
    noi_cap?: string;
    ngay_cap?: string;
    ngay_het_han?: string;
    hang_gplx?: string;
    ngay_trung_tuyen?: string;
    status?: string;
  } | null;
  liveError?: string;
}

type TrafficApiRawResult = string | { resultHtml?: string; data?: string; message?: string };

// ─── traffic helpers ─────────────────────────────────────────────────────────
const formatLicensePlate = (p: string) => p.trim().toUpperCase().replace(/\s/g, '');
const buildTrafficCheckUrl = (p: string, t: string) => `${TRAFFIC_BASE_URL}/${p}/${t}`;
const hasElectronWebRequest = () => Boolean((window as any).electronAPI?.webRequest);

const requestTrafficWeb = async (url: string): Promise<TrafficApiRawResult> => {
  const res = await fetch(url, { method: 'GET', credentials: 'omit' });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

const extractResultHtml = (r: TrafficApiRawResult) => {
  if (typeof r === 'string') return { html: r };
  if (r?.resultHtml || r?.data) return { html: r.resultHtml || r.data || null };
  if (r?.message) return { html: null, message: r.message };
  return { html: null };
};

const sanitizeResultHtml = (raw: string) => {
  const el = document.createElement('div');
  el.innerHTML = raw;
  ['button','.modal','.btn','script','style','a[href*="play.google.com"]','a[href*="apps.apple.com"]'].forEach(s =>
    el.querySelectorAll(s).forEach(n => n.remove())
  );
  el.querySelectorAll('b,span,div').forEach(n => {
    if (n.textContent?.includes('Tra cứu nhanh hơn tại ứng dụng')) n.remove();
  });
  const show = el.querySelector('#showViolationData');
  if (show instanceof HTMLElement) { show.style.display = 'block'; show.style.opacity = '1'; }
  el.querySelectorAll('[style]').forEach(n => {
    if (n instanceof HTMLElement) {
      if (n.style.display === 'none') n.style.display = 'block';
      if (n.style.opacity === '0')    n.style.opacity = '1';
    }
  });
  return el.innerHTML;
};

// ─── GPLX card ───────────────────────────────────────────────────────────────
const GplxCard: React.FC<{ record: GplxRecord; index: number }> = ({ record, index }) => {
  const live = record.live;
  const isValid = record.ket_qua_xac_thuc?.toLowerCase().includes('hợp lệ');

  return (
    <div className="gplx-card">
      <div className="gplx-card-header">
        <div className="gplx-card-title">
          <i className="material-icons">credit_card</i>
          <span>Bằng lái #{index + 1}</span>
        </div>
        <span className={`gplx-badge ${isValid ? 'valid' : 'invalid'}`}>
          <i className="material-icons">{isValid ? 'check_circle' : 'cancel'}</i>
          {record.ket_qua_xac_thuc || 'Không xác định'}
        </span>
      </div>

      <div className="gplx-card-body">
        <div className="gplx-grid">
          <div className="gplx-row"><span className="gplx-label">Họ và tên</span><span className="gplx-value">{live?.ho_va_ten || record.ho_ten || '—'}</span></div>
          <div className="gplx-row"><span className="gplx-label">Số GPLX</span><span className="gplx-value gplx-highlight">{live?.so_gplx || record.so_gplx || '—'}</span></div>
          <div className="gplx-row"><span className="gplx-label">Hạng</span><span className="gplx-value">{live?.hang_gplx || record.hang || '—'}</span></div>
          <div className="gplx-row"><span className="gplx-label">Ngày sinh</span><span className="gplx-value">{live?.ngay_sinh || record.ngay_sinh || '—'}</span></div>
          {live && (<>
            <div className="gplx-row"><span className="gplx-label">Nơi cấp</span><span className="gplx-value">{live.noi_cap || '—'}</span></div>
            <div className="gplx-row"><span className="gplx-label">Ngày cấp</span><span className="gplx-value">{live.ngay_cap || '—'}</span></div>
            <div className="gplx-row"><span className="gplx-label">Ngày hết hạn</span><span className="gplx-value">{live.ngay_het_han || '—'}</span></div>
            <div className="gplx-row"><span className="gplx-label">Ngày trúng tuyển</span><span className="gplx-value">{live.ngay_trung_tuyen || '—'}</span></div>
          </>)}
          {record.ly_do_tu_choi && (
            <div className="gplx-row gplx-row-full"><span className="gplx-label">Lý do từ chối</span><span className="gplx-value gplx-error">{record.ly_do_tu_choi}</span></div>
          )}
        </div>
        {record.liveError && <div className="gplx-live-error"><i className="material-icons">warning_amber</i> {record.liveError}</div>}
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
const TrafficCheck: React.FC = () => {
  const { post } = useApi();
  const [activeTab, setActiveTab] = useState<'gplx' | 'traffic'>('gplx');

  // traffic state
  const [loaiXe,         setLoaiXe]         = useState('1');
  const [bienSo,         setBienSo]         = useState('');
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [resultHtml,     setResultHtml]     = useState<string | null>(null);
  const [trafficError,   setTrafficError]   = useState<string | null>(null);
  const [trafficSearched, setTrafficSearched] = useState(false);

  // gplx state
  const [cccd,           setCccd]           = useState('');
  const [captchaCode,    setCaptchaCode]    = useState('');
  const [captchaSession, setCaptchaSession] = useState<string | null>(null);
  const [captchaBase64,  setCaptchaBase64]  = useState<string | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [gplxLoading,    setGplxLoading]    = useState(false);
  const [gplxList,       setGplxList]       = useState<GplxRecord[]>([]);
  const [gplxError,      setGplxError]      = useState<string | null>(null);
  const [gplxSearched,   setGplxSearched]   = useState(false);

  const selectedVehicle = VEHICLE_TYPES.find(v => v.value === loaiXe);
  const API_BASE = getConfig().API_BASE_URL;

  // Load captcha khi mở trang lần đầu (tab GPLX là mặc định)
  useEffect(() => { loadCaptcha(); }, []);

  // ── load captcha ──
  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaCode('');
    setCaptchaBase64(null);
    setGplxError(null);
    try {
      const res = await fetch(`${API_BASE}/api/gplx/captcha-session`, { credentials: 'include' });
      const data = await res.json();
      if (data?.EC === 0) {
        setCaptchaSession(data.DT.sessionId);
        setCaptchaBase64(data.DT.captchaBase64 || null);
        if (data.DT.autoSolvedCode) setCaptchaCode(data.DT.autoSolvedCode);
      } else {
        setGplxError(data?.EM || 'Không tải được captcha, vui lòng thử lại');
      }
    } catch (err: any) {
      setGplxError('Không kết nối được backend: ' + (err?.message || ''));
    } finally {
      setCaptchaLoading(false);
    }
  };

  // ── traffic search ──
  const handleTrafficSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bienSo.trim()) { setTrafficError('Vui lòng nhập biển số xe.'); return; }
    setTrafficLoading(true); setTrafficError(null); setResultHtml(null); setTrafficSearched(true);
    try {
      const url = buildTrafficCheckUrl(formatLicensePlate(bienSo), loaiXe);
      let raw: TrafficApiRawResult;
      if (hasElectronWebRequest()) {
        const r = await (window as any).electronAPI.webRequest({ url, method: 'GET' });
        raw = r.success ? r.data : { message: r.message };
      } else {
        raw = await requestTrafficWeb(url);
      }
      const { html, message } = extractResultHtml(raw);
      if (html) { setResultHtml(sanitizeResultHtml(html)); return; }
      setTrafficError(message || 'Không tìm thấy dữ liệu vi phạm.');
    } catch { setTrafficError('Lỗi kết nối. Vui lòng thử lại sau.'); }
    finally   { setTrafficLoading(false); }
  };

  // ── GPLX search ──
  const handleGplxSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cccd.trim())        { setGplxError('Vui lòng nhập số CMND/CCCD.'); return; }
    if (!captchaCode.trim()) { setGplxError('Vui lòng nhập mã captcha.'); return; }
    if (!captchaSession)     { setGplxError('Captcha hết hạn, hãy làm mới.'); loadCaptcha(); return; }
    setGplxLoading(true); setGplxError(null); setGplxList([]); setGplxSearched(true);
    try {
      const res = await post<any>('/api/gplx/lookup', {
        cccd: cccd.trim(),
        captchaCode: captchaCode.trim(),
        sessionId: captchaSession,
      });
      if (res?.EC === 0) {
        setGplxList(res.DT || []);
        setCaptchaSession(null);
        setCaptchaBase64(null);
        setCaptchaCode('');
        loadCaptcha();
      } else {
        setGplxError(res?.EM || 'Không tìm thấy thông tin GPLX.');
        if (res?.EM?.includes('captcha') || res?.EM?.includes('Captcha')) loadCaptcha();
      }
    } catch { setGplxError('Lỗi kết nối. Vui lòng thử lại sau.'); }
    finally   { setGplxLoading(false); }
  };

  return (
    <div className="tc-wrapper">
      {/* banner */}
      <div className="tc-banner">
        <div className="tc-banner-content">
          <img src="https://anh.csgt.vn/logo-csgt.png" alt="Logo" className="tc-banner-logo" />
          <div className="tc-banner-text">
            <span className="tc-banner-line1">CỔNG TRA CỨU THÔNG TIN</span>
            <span className="tc-banner-line2">GPLX & VI PHẠM GIAO THÔNG</span>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="tc-tabs-bar">
        <div className="tc-tabs">
          <button
            className={`tc-tab ${activeTab === 'gplx' ? 'active' : ''}`}
            onClick={() => { setActiveTab('gplx'); if (!captchaSession) loadCaptcha(); }}
          >
            <i className="material-icons">badge</i>
            Tra cứu GPLX / CCCD
          </button>
          <button
            className={`tc-tab ${activeTab === 'traffic' ? 'active' : ''}`}
            onClick={() => setActiveTab('traffic')}
          >
            <i className="material-icons">traffic</i>
            Tra cứu vi phạm
          </button>
        </div>
      </div>

      <div className="tc-container">

        {/* ── TAB 1: GPLX ── */}
        {activeTab === 'gplx' && (
          <>
            <div className="tc-form-card">
              <div className="tc-card-accent" />
              <div className="tc-form-body">
                <div className="tc-section-title">
                  <i className="material-icons">manage_search</i>
                  Tra cứu Giấy phép lái xe
                </div>
                <form onSubmit={handleGplxSearch}>
                  <div className="tc-field-group">
                    <label>Số CMND / CCCD / Hộ chiếu</label>
                    <div className="tc-input-wrapper">
                      <div className="tc-input-prefix"><i className="material-icons">badge</i></div>
                      <input type="text" className="tc-input-field" placeholder="Nhập số CCCD / CMND"
                        value={cccd} onChange={e => setCccd(e.target.value.trim())} maxLength={20} />
                    </div>
                  </div>

                  <div className="tc-field-group">
                    <label>Mã xác nhận (captcha)</label>
                    <div className="tc-captcha-inline">
                      <div className="tc-captcha-img-wrap">
                        {captchaLoading
                          ? <div className="tc-captcha-img tc-captcha-loading"><span className="tc-spinner tc-spinner-dark" /></div>
                          : captchaBase64
                            ? <img src={captchaBase64} alt="captcha" className="tc-captcha-img" />
                            : <div className="tc-captcha-img tc-captcha-empty" onClick={loadCaptcha}>Nhấn để tải</div>}
                        <button type="button" className="tc-captcha-refresh" onClick={loadCaptcha} disabled={captchaLoading} title="Làm mới captcha">
                          <i className="material-icons">refresh</i>
                        </button>
                      </div>
                      <input type="text" className="tc-captcha-input" placeholder="Nhập mã trong ảnh"
                        value={captchaCode} onChange={e => setCaptchaCode(e.target.value)} maxLength={8} autoComplete="off" />
                    </div>
                  </div>

                  {gplxError && <div className="tc-error-msg"><i className="material-icons">error_outline</i>{gplxError}</div>}

                  <button type="submit" className="tc-submit-btn" disabled={gplxLoading || captchaLoading}>
                    {gplxLoading
                      ? <><span className="tc-spinner" /> Đang tra cứu...</>
                      : <><i className="material-icons">search</i> Tra cứu</>}
                  </button>
                </form>
              </div>
            </div>

            <div className="tc-footer-note">
              <i className="material-icons">info</i>
              Dữ liệu được cập nhật từ hệ thống Cục CSGT - Bộ Công An
            </div>

            {gplxLoading && (
              <div className="tc-gplx-loading">
                <div className="tc-spinner-large" />
                <p>Đang tra cứu dữ liệu từ hệ thống Cục CSGT...</p>
              </div>
            )}

            {gplxSearched && !gplxLoading && (
              <div className="tc-results">
                {gplxList.length > 0
                  ? <div className="gplx-list">
                      {gplxList.map((r, i) => <GplxCard key={r.id} record={r} index={i} />)}
                    </div>
                  : gplxError && (
                    <div className="tc-no-result">
                      <i className="material-icons">search_off</i>
                      <p>{gplxError}</p>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: Phạt nguội ── */}
        {activeTab === 'traffic' && (
          <>
            <div className="tc-form-card">
              <div className="tc-card-accent tc-card-accent--blue" />
              <div className="tc-form-body">
                <div className="tc-section-title">
                  <i className="material-icons">directions_car</i>
                  Tra cứu vi phạm
                </div>
                <form onSubmit={handleTrafficSearch}>
                  <div className="tc-field-group">
                    <label>Loại phương tiện</label>
                    <div className="tc-input-wrapper">
                      <div className="tc-input-prefix"><i className="material-icons">{selectedVehicle?.icon}</i></div>
                      <select className="tc-select-field" value={loaiXe} onChange={e => setLoaiXe(e.target.value)}>
                        {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="tc-field-group">
                    <label>Biển số xe</label>
                    <div className="tc-input-wrapper">
                      <div className="tc-input-prefix"><i className="material-icons">pin</i></div>
                      <input type="text" className="tc-input-field" placeholder="Ví dụ: 89A-22222"
                        value={bienSo} onChange={e => setBienSo(e.target.value.toUpperCase())} />
                    </div>
                  </div>
                  {trafficError && !resultHtml && <div className="tc-error-msg"><i className="material-icons">error_outline</i>{trafficError}</div>}
                  <button type="submit" className="tc-submit-btn tc-submit-btn--blue" disabled={trafficLoading}>
                    {trafficLoading
                      ? <><span className="tc-spinner" /> Đang tra cứu...</>
                      : <><i className="material-icons">search</i> Tra cứu</>}
                  </button>
                </form>
              </div>
            </div>

            <div className="tc-footer-note">
              <i className="material-icons">info</i>
              Dữ liệu được cập nhật từ hệ thống Cục CSGT - Bộ Công An
            </div>

            {trafficLoading && (
              <div className="tc-skeleton">
                <div className="tc-skeleton-bar" style={{ width: '55%' }} />
                <div className="tc-skeleton-bar" style={{ width: '75%' }} />
                <div className="tc-skeleton-bar" style={{ width: '65%' }} />
              </div>
            )}

            {trafficSearched && !trafficLoading && (
              <div className="tc-results">
                {resultHtml
                  ? <div className="tc-result-html" dangerouslySetInnerHTML={{ __html: resultHtml }} />
                  : trafficError && (
                    <div className="tc-no-result">
                      <i className="material-icons">search_off</i>
                      <p>{trafficError}</p>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default TrafficCheck;
