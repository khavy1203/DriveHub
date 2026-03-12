import React, { useState } from 'react';
import useApiService from 'src/services/useApiService';
import './TrafficCheck.css';
import { TRAFFIC_BASE_URL } from 'src/core/constants/config';

const VEHICLE_TYPES = [
  { value: '1', label: 'Xe ô tô', icon: 'airport_shuttle' },
  { value: '2', label: 'Xe máy', icon: 'two_wheeler' },
  { value: '3', label: 'Xe máy điện', icon: 'electric_bike' },
];

type TrafficApiRawResult =
  | string
  | {
      resultHtml?: string;
      data?: string;
      message?: string;
    };

const MAX_LICENSE_LENGTH = 9;
const MAX_LICENSE_LETTERS = 2;

const formatLicensePlate = (plate: string) =>
  plate.trim().toUpperCase().replace(/\s/g, '');

const buildTrafficCheckUrl = (plate: string, vehicleType: string) =>
  `${TRAFFIC_BASE_URL}/${plate}/${vehicleType}`;

const hasElectronWebRequest = () =>
  Boolean((window as any).electronAPI?.webRequest);

const extractResultHtml = (
  result: TrafficApiRawResult,
): { html: string | null; message?: string } => {
  if (typeof result === 'string') {
    return { html: result };
  }

  if (result?.resultHtml || result?.data) {
    return { html: result.resultHtml || result.data || null };
  }

  if (result?.message) {
    return { html: null, message: result.message };
  }

  return { html: null };
};

const sanitizeResultHtml = (rawHtml: string): string => {
  const container = document.createElement('div');
  container.innerHTML = rawHtml;

  const selectorsToRemove = [
    'button',
    '.modal',
    '.modal-overlay',
    '.modal-backdrop',
    '[id*="modal"]',
    '.btn',
    'script',
    'style',
    'a[href*="play.google.com"]',
    'a[href*="apps.apple.com"]',
    'img[src*="play-store"]',
    'img[src*="app-store"]',
  ];

  selectorsToRemove.forEach((selector) => {
    container.querySelectorAll(selector).forEach((el) => el.remove());
  });

  container.querySelectorAll('b, span, div').forEach((el) => {
    if (el.textContent?.includes('Tra cứu nhanh hơn tại ứng dụng')) {
      el.remove();
    }
  });

  const showDataEl = container.querySelector('#showViolationData');
  if (showDataEl instanceof HTMLElement) {
    showDataEl.style.display = 'block';
    showDataEl.style.opacity = '1';
    showDataEl.style.visibility = 'visible';
  }

  container.querySelectorAll('[style]').forEach((el) => {
    if (el instanceof HTMLElement) {
      const style = el.style;
      if (style.display === 'none') style.display = 'block';
      if (style.opacity === '0') style.opacity = '1';
      if (style.visibility === 'hidden') style.visibility = 'visible';
    }
  });

  return container.innerHTML;
};

/**
 * Simplified Traffic lookup using api.phatnguoi.vn
 */
const TrafficCheck: React.FC = () => {
  const { get } = useApiService();
  const [loaiXe, setLoaiXe] = useState('1');
  const [bienSo, setBienSo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const selectedVehicle = VEHICLE_TYPES.find((v) => v.value === loaiXe);

  const handleBienSoChange = (rawValue: string) => {
    const upperValue = rawValue.toUpperCase();

    const valueWithoutSpaces = upperValue.replace(/\s/g, '');

    if (valueWithoutSpaces.length > MAX_LICENSE_LENGTH) {
      return;
    }

    const letterCount = (valueWithoutSpaces.match(/[A-Z]/g) || []).length;
    if (letterCount > MAX_LICENSE_LETTERS) {
      return;
    }

    setBienSo(upperValue);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bienSo.trim()) {
      setError('Vui lòng nhập biển số xe.');
      return;
    }

    setLoading(true);
    setError(null);
    setResultHtml(null);
    setSearched(true);

    try {
      const formattedPlate = formatLicensePlate(bienSo);
      const url = buildTrafficCheckUrl(formattedPlate, loaiXe);

      let rawResult: TrafficApiRawResult;

      if (hasElectronWebRequest()) {
        console.log('[Electron Mode] Calling phatnguoi via IPC...');
        const ipcResponse = await (window as any).electronAPI.webRequest({
          url,
          method: 'GET',
        });

        rawResult = ipcResponse.success
          ? ipcResponse.data
          : { message: ipcResponse.message };
      } else {
        console.log('[Web Mode] Calling phatnguoi via useApiService...');
        rawResult = await get<TrafficApiRawResult>(url);
      }

      const { html, message } = extractResultHtml(rawResult);

      if (html) {
        const cleanedHtml = sanitizeResultHtml(html);
        setResultHtml(cleanedHtml);
        return;
      }

      setError(message || 'Không tìm thấy dữ liệu vi phạm.');
    } catch (error) {
      console.error('[Search Error]', error);
      setError('Lỗi kết nối hệ thống tra cứu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tc-wrapper">
      <div className="tc-banner">
        <div className="tc-banner-content">
          <img src="https://anh.csgt.vn/logo-csgt.png" alt="Logo" className="tc-banner-logo" />
          <div className="tc-banner-text">
            <span className="tc-banner-line1">BỘ CÔNG AN</span>
            <span className="tc-banner-line2">CỤC CẢNH SÁT GIAO THÔNG</span>
          </div>
        </div>
      </div>

      <div className="tc-navbar">
        <div className="tc-navbar-content">
          <a href="/"><i className="material-icons">home</i></a>
          <div className="tc-navbar-spacer"></div>
          <i className="material-icons">search</i>
        </div>
      </div>

      <div className="tc-container">
        <div className="tc-form-card">
          <div className="tc-title">Tra cứu phạt nguội</div>
          <div className="tc-form-body">
            <form onSubmit={handleSearch}>
              <div className="tc-field-group">
                <label>Loại phương tiện</label>
                <div className="tc-input-wrapper">
                  <div className="tc-input-prefix">
                    <i className="material-icons">{selectedVehicle?.icon}</i>
                  </div>
                  <select
                    className="tc-select-field"
                    value={loaiXe}
                    onChange={(e) => setLoaiXe(e.target.value)}
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="tc-field-group">
                <label>Biển số xe</label>
                <div className="tc-input-wrapper">
                  <div className="tc-input-prefix">123</div>
                  <input
                    type="text"
                    className="tc-input-field"
                    placeholder="Nhập biển số xe ví dụ 89a22222"
                    value={bienSo}
                    onChange={(e) => handleBienSoChange(e.target.value)}
                  />
                </div>
              </div>

              {error && !resultHtml && (
                <div className="tc-error-msg">{error}</div>
              )}

              <button type="submit" className="tc-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="tc-btn-loading">
                    <span className="tc-spinner"></span>
                  </span>
                ) : (
                  'Tra cứu'
                )}
              </button>
            </form>
          </div>
        </div>

        {searched && !loading && (
          <div className="tc-results">
            {resultHtml ? (
              <div
                className="tc-result-html"
                dangerouslySetInnerHTML={{ __html: resultHtml }}
              />
            ) : (
              error && (
                <div className="tc-no-result">
                  <i className="material-icons">info_outline</i>
                  <p>{error}</p>
                </div>
              )
            )}
          </div>
        )}

        {loading && (
          <div className="tc-skeleton">
            <div className="tc-skeleton-bar" style={{ width: '60%' }} />
            <div className="tc-skeleton-bar" style={{ width: '80%' }} />
            <div className="tc-skeleton-bar" style={{ width: '70%' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficCheck;
