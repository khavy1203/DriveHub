import React, { useCallback, useEffect, useState } from 'react';
import './LicenseCheck.scss';

import { getConfig } from 'src/core/config/environment';
import { useApi } from 'src/shared/hooks';

import GplxCard from './GplxCard';
import LicenseLookupForm from './LicenseLookupForm';
import {
  CaptchaSessionResponse,
  LicenseLookupResponse,
  mapLicenseRecord,
  CaptchaUiState,
  LicenseLookupFormValues,
  LicenseLookupUiState,
} from '../types';

const LicenseCheck: React.FC = () => {
  const { post } = useApi();
  const apiBaseUrl = getConfig().API_BASE_URL;

  const [prefilledCaptchaCode, setPrefilledCaptchaCode] = useState('');

  const [captchaState, setCaptchaState] = useState<CaptchaUiState>({
    sessionId: null,
    base64: null,
    loading: false,
  });

  const [lookupState, setLookupState] = useState<LicenseLookupUiState>({
    loading: false,
    list: [],
    error: null,
    searched: false,
  });

  const loadCaptcha = useCallback(async () => {
    setCaptchaState((prev) => ({ ...prev, loading: true, base64: null }));
    setPrefilledCaptchaCode('');
    setLookupState((prev) => ({ ...prev, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/gplx/captcha-session`, { credentials: 'include' });
      const data: CaptchaSessionResponse = await response.json();

      if (data?.EC === 0 && data.DT) {
        const payload = data.DT;
        setCaptchaState({
          sessionId: payload.sessionId,
          base64: payload.captchaBase64 || null,
          loading: false,
        });
        setPrefilledCaptchaCode(payload.autoSolvedCode || '');
        return;
      }

      setLookupState((prev) => ({
        ...prev,
        error: data?.EM || 'Không tải được captcha, vui lòng thử lại.',
      }));
      setCaptchaState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setLookupState((prev) => ({
        ...prev,
        error: `Không kết nối được backend: ${message}`,
      }));
      setCaptchaState((prev) => ({ ...prev, loading: false }));
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleLookupSubmit = async (values: LicenseLookupFormValues) => {
    const identityNumber = values.identityNumber.trim();
    const captchaCode = values.captchaCode.trim();

    if (!identityNumber) {
      setLookupState((prev) => ({ ...prev, error: 'Vui lòng nhập số CMND/CCCD.' }));
      return;
    }

    if (!captchaCode) {
      setLookupState((prev) => ({ ...prev, error: 'Vui lòng nhập mã captcha.' }));
      return;
    }

    if (!captchaState.sessionId) {
      setLookupState((prev) => ({ ...prev, error: 'Captcha hết hạn, vui lòng làm mới.' }));
      loadCaptcha();
      return;
    }

    setLookupState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      list: [],
      searched: true,
    }));

    try {
      const result = await post<LicenseLookupResponse>('/api/gplx/lookup', {
        cccd: identityNumber,
        captchaCode,
        sessionId: captchaState.sessionId,
      });

      if (result?.EC === 0) {
        setLookupState((prev) => ({ ...prev, list: (result.DT || []).map(mapLicenseRecord) }));
        setCaptchaState((prev) => ({ ...prev, sessionId: null, base64: null }));
        setPrefilledCaptchaCode('');
        loadCaptcha();
      } else {
        setLookupState((prev) => ({
          ...prev,
          error: result?.EM || 'Không tìm thấy thông tin GPLX.',
        }));

        if (result?.EM?.toLowerCase().includes('captcha')) {
          loadCaptcha();
        }
      }
    } catch {
      setLookupState((prev) => ({ ...prev, error: 'Lỗi kết nối. Vui lòng thử lại sau.' }));
    } finally {
      setLookupState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="tc-wrapper">
      <div className="tc-banner">
        <div className="tc-banner-content">
          <img src="https://anh.csgt.vn/logo-csgt.png" alt="Logo" className="tc-banner-logo" />
          <div className="tc-banner-text">
            <span className="tc-banner-line1">CỔNG TRA CỨU THÔNG TIN</span>
            <span className="tc-banner-line2">GIẤY PHÉP LÁI XE</span>
          </div>
        </div>
      </div>

      <div className="tc-container">
        <div className="tc-form-card">
          <div className="tc-card-accent" />
          <div className="tc-form-body">
            <div className="tc-section-title">
              <i className="material-icons">manage_search</i>
              Tra cứu giấy phép lái xe
            </div>

            <LicenseLookupForm
              captchaImageBase64={captchaState.base64}
              captchaLoading={captchaState.loading}
              lookupLoading={lookupState.loading}
              errorMessage={lookupState.error}
              prefilledCaptchaCode={prefilledCaptchaCode}
              onRefreshCaptcha={loadCaptcha}
              onSubmitLookup={handleLookupSubmit}
            />
          </div>
        </div>

        <div className="tc-footer-note">
          <i className="material-icons">info</i>
          Dữ liệu được cập nhật từ hệ thống Cục CSGT - Bộ Công An
        </div>

        {lookupState.loading && (
          <div className="tc-gplx-loading">
            <div className="tc-spinner-large" />
            <p>Đang tra cứu dữ liệu từ hệ thống Cục CSGT...</p>
          </div>
        )}

        {lookupState.searched && !lookupState.loading && (
          <div className="tc-results">
            {lookupState.list.length > 0 ? (
              <div className="gplx-list">
                {lookupState.list.map((record, index) => (
                  <GplxCard key={record.id} record={record} index={index} />
                ))}
              </div>
            ) : (
              lookupState.error && (
                <div className="tc-no-result">
                  <i className="material-icons">search_off</i>
                  <p>{lookupState.error}</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseCheck;
