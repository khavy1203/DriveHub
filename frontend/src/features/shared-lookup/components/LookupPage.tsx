import React, { useState } from 'react';
import '../styles/LookupPage.scss';

import GplxCard from '../../license-check/components/GplxCard';
import LicenseLookupForm from '../../license-check/components/LicenseLookupForm';
import useLicenseLookup from '../../license-check/hooks/useLicenseLookup';

import { VEHICLE_TYPES } from '../../traffic-check/constants';
import { TrafficApiRawResult } from '../../traffic-check/types';
import {
  buildTrafficCheckUrl,
  extractResultHtml,
  formatLicensePlate,
  hasElectronWebRequest,
  requestTrafficWeb,
  sanitizeResultHtml,
} from '../../traffic-check/utils';

type TabKey = 'gplx' | 'traffic';

const LookupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('gplx');

  // ── GPLX state (via custom hook) ──────────────────────────────────────────
  const {
    register,
    errors,
    submitLookup,
    refreshCaptcha,
    loaiXe,
    setLoaiXe,
    captchaImageBase64,
    captchaLoading,
    lookupLoading,
    lookupError,
    hasSearched,
    lookupResults,
  } = useLicenseLookup();

  // ── Traffic state ─────────────────────────────────────────────────────────
  const [trafficLoaiXe, setTrafficLoaiXe] = useState('1');
  const [bienSo, setBienSo] = useState('');
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const [trafficSearched, setTrafficSearched] = useState(false);

  const selectedVehicle = VEHICLE_TYPES.find((v) => v.value === trafficLoaiXe);

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
      const lookupUrl = buildTrafficCheckUrl(formatLicensePlate(bienSo), trafficLoaiXe);
      let rawResult: TrafficApiRawResult;

      if (hasElectronWebRequest()) {
        const electronResult = await (window as unknown as { electronAPI: { webRequest: (opts: { url: string; method: string }) => Promise<{ success: boolean; data: TrafficApiRawResult; message?: string }> } }).electronAPI.webRequest({ url: lookupUrl, method: 'GET' });
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

  // ── Banner text per tab ───────────────────────────────────────────────────
  const bannerLine2 = activeTab === 'gplx' ? 'GIẤY PHÉP LÁI XE' : 'VI PHẠM GIAO THÔNG';

  return (
    <div className="tc-wrapper">
      <div className="tc-banner">
        <div className="tc-banner-content">
          <img src="https://anh.csgt.vn/logo-csgt.png" alt="Logo" className="tc-banner-logo" />
          <div className="tc-banner-text">
            <span className="tc-banner-line1">CỔNG TRA CỨU THÔNG TIN</span>
            <span className="tc-banner-line2">{bannerLine2}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="tc-tabs-bar">
        <div className="tc-tabs">
          <button
            type="button"
            className={`tc-tab${activeTab === 'gplx' ? ' active' : ''}`}
            onClick={() => setActiveTab('gplx')}
          >
            <i className="material-icons">credit_card</i>
            Tra cứu GPLX
          </button>
          <button
            type="button"
            className={`tc-tab${activeTab === 'traffic' ? ' active' : ''}`}
            onClick={() => setActiveTab('traffic')}
          >
            <i className="material-icons">directions_car</i>
            Phạt nguội
          </button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="tc-container">
        {activeTab === 'gplx' && (
          <>
            <div className="tc-form-card">
              <div className="tc-card-accent" />
              <div className="tc-form-body">
                <div className="tc-section-title">
                  <i className="material-icons">manage_search</i>
                  Tra cứu giấy phép lái xe
                </div>

                <LicenseLookupForm
                  register={register}
                  errors={errors}
                  onSubmit={submitLookup}
                  onRefreshCaptcha={refreshCaptcha}
                  captchaImageBase64={captchaImageBase64}
                  captchaLoading={captchaLoading}
                  lookupLoading={lookupLoading}
                  errorMessage={lookupError}
                  loaiXe={loaiXe}
                  onLoaiXeChange={setLoaiXe}
                />
              </div>
            </div>

            <div className="tc-footer-note">
              <i className="material-icons">info</i>
              Dữ liệu được cập nhật từ hệ thống Cục CSGT - Bộ Công An - Chỉ áp dụng Tra Cứu cho thí sinh nộp hồ sơ tại trường Cao Đẳng Cơ Điện Xây Dựng và Nông Lâm Trung Bộ
            </div>

            {hasSearched && !lookupLoading && (
              <div className="tc-results">
                {lookupResults.length > 0 ? (
                  <div className="gplx-list">
                    {lookupResults.map((record, index) => (
                      <GplxCard key={record.id} record={record} index={index} />
                    ))}
                  </div>
                ) : (
                  lookupError && (
                    <div className="tc-no-result">
                      <i className="material-icons">search_off</i>
                      <p>{lookupError}</p>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}

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
                      <div className="tc-input-prefix">
                        <i className="material-icons">{selectedVehicle?.icon}</i>
                      </div>
                      <select
                        className="tc-select-field"
                        value={trafficLoaiXe}
                        onChange={(e) => setTrafficLoaiXe(e.target.value)}
                      >
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
          </>
        )}
      </div>
    </div>
  );
};

export default LookupPage;
