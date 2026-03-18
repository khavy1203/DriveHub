import React, { useState } from 'react';
import './TrafficCheck.scss';

import { VEHICLE_TYPES } from '../constants';
import { TrafficApiRawResult } from '../types';
import {
  buildTrafficCheckUrl,
  extractResultHtml,
  formatLicensePlate,
  hasElectronWebRequest,
  requestTrafficWeb,
  sanitizeResultHtml,
} from '../utils';

const TrafficCheck: React.FC = () => {
  const [loaiXe, setLoaiXe] = useState('1');
  const [bienSo, setBienSo] = useState('');
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const [trafficSearched, setTrafficSearched] = useState(false);

  const selectedVehicle = VEHICLE_TYPES.find((v) => v.value === loaiXe);

  const handleTrafficSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bienSo.trim()) {
      setTrafficError('Vui lòng nhập biển số xe.');
      return;
    }

    setTrafficLoading(true);
    setTrafficError(null);
    setResultHtml(null);
    setTrafficSearched(true);

    try {
      const lookupUrl = buildTrafficCheckUrl(formatLicensePlate(bienSo), loaiXe);
      let rawResult: TrafficApiRawResult;

      if (hasElectronWebRequest()) {
        const electronResult = await (window as any).electronAPI.webRequest({ url: lookupUrl, method: 'GET' });
        rawResult = electronResult.success ? electronResult.data : { message: electronResult.message };
      } else {
        rawResult = await requestTrafficWeb(lookupUrl);
      }

      const { html, message } = extractResultHtml(rawResult);
      if (html) {
        setResultHtml(sanitizeResultHtml(html));
        return;
      }

      setTrafficError(message || 'Không tìm thấy dữ liệu vi phạm.');
    } catch {
      setTrafficError('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setTrafficLoading(false);
    }
  };

  return (
    <div className="tc-wrapper">
      <div className="tc-banner">
        <div className="tc-banner-content">
          <img src="https://anh.csgt.vn/logo-csgt.png" alt="Logo" className="tc-banner-logo" />
          <div className="tc-banner-text">
            <span className="tc-banner-line1">CỔNG TRA CỨU THÔNG TIN</span>
            <span className="tc-banner-line2">VI PHẠM GIAO THÔNG</span>
          </div>
        </div>
      </div>

      <div className="tc-container">
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
                  <div className="tc-input-prefix">
                    <i className="material-icons">{selectedVehicle?.icon}</i>
                  </div>
                  <select className="tc-select-field" value={loaiXe} onChange={(e) => setLoaiXe(e.target.value)}>
                    {VEHICLE_TYPES.map((vehicle) => (
                      <option key={vehicle.value} value={vehicle.value}>
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="tc-field-group">
                <label>Biển số xe</label>
                <div className="tc-input-wrapper">
                  <div className="tc-input-prefix">
                    <i className="material-icons">pin</i>
                  </div>
                  <input
                    type="text"
                    className="tc-input-field"
                    placeholder="Ví dụ: 89A-22222"
                    value={bienSo}
                    onChange={(e) => setBienSo(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {trafficError && !resultHtml && (
                <div className="tc-error-msg">
                  <i className="material-icons">error_outline</i>
                  {trafficError}
                </div>
              )}

              <button type="submit" className="tc-submit-btn tc-submit-btn--blue" disabled={trafficLoading}>
                {trafficLoading ? (
                  <>
                    <span className="tc-spinner" /> Đang tra cứu...
                  </>
                ) : (
                  <>
                    <i className="material-icons">search</i> Tra cứu
                  </>
                )}
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
            {resultHtml ? (
              <div className="tc-result-html" dangerouslySetInnerHTML={{ __html: resultHtml }} />
            ) : (
              trafficError && (
                <div className="tc-no-result">
                  <i className="material-icons">search_off</i>
                  <p>{trafficError}</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficCheck;
