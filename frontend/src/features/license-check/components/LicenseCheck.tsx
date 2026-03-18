import React, { useCallback, useEffect, useState } from 'react';
import './LicenseCheck.scss';

import { getConfig } from 'src/core/config/environment';
import { useApi } from 'src/shared/hooks';

import GplxCard from './GplxCard';
import {
  CaptchaSessionResponse,
  GplxLookupResponse,
  CaptchaState,
  LicenseCheckFormState,
  LookupState,
} from '../types';

const LicenseCheck: React.FC = () => {
  const { post } = useApi();
  const apiBaseUrl = getConfig().API_BASE_URL;

  const [form, setForm] = useState<LicenseCheckFormState>({
    cccd: '',
    captchaCode: '',
  });

  const [captcha, setCaptcha] = useState<CaptchaState>({
    sessionId: null,
    base64: null,
    loading: false,
  });

  const [lookup, setLookup] = useState<LookupState>({
    loading: false,
    list: [],
    error: null,
    searched: false,
  });

  const loadCaptcha = useCallback(async () => {
    setCaptcha((prev) => ({ ...prev, loading: true, base64: null }));
    setForm((prev) => ({ ...prev, captchaCode: '' }));
    setLookup((prev) => ({ ...prev, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/gplx/captcha-session`, { credentials: 'include' });
      const data: CaptchaSessionResponse = await response.json();

      if (data?.EC === 0 && data.DT) {
        const dt = data.DT;
        setCaptcha({
          sessionId: dt.sessionId,
          base64: dt.captchaBase64 || null,
          loading: false,
        });

        if (dt.autoSolvedCode) {
          setForm((prev) => ({ ...prev, captchaCode: dt.autoSolvedCode || '' }));
        }

        return;
      }

      setLookup((prev) => ({
        ...prev,
        error: data?.EM || 'Khong tai duoc captcha, vui long thu lai',
      }));
      setCaptcha((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setLookup((prev) => ({
        ...prev,
        error: `Khong ket noi duoc backend: ${message}`,
      }));
      setCaptcha((prev) => ({ ...prev, loading: false }));
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleGplxSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const cccd = form.cccd.trim();
    const captchaCode = form.captchaCode.trim();

    if (!cccd) {
      setLookup((prev) => ({ ...prev, error: 'Vui lÃ²ng nháº­p sá»‘ CMND/CCCD.' }));
      return;
    }

    if (!captchaCode) {
      setLookup((prev) => ({ ...prev, error: 'Vui lÃ²ng nháº­p mÃ£ captcha.' }));
      return;
    }

    if (!captcha.sessionId) {
      setLookup((prev) => ({ ...prev, error: 'Captcha háº¿t háº¡n, vui lÃ²ng lÃ m má»›i.' }));
      loadCaptcha();
      return;
    }

    setLookup((prev) => ({
      ...prev,
      loading: true,
      error: null,
      list: [],
      searched: true,
    }));

    try {
      const result = await post<GplxLookupResponse>('/api/gplx/lookup', {
        cccd,
        captchaCode,
        sessionId: captcha.sessionId,
      });

      if (result?.EC === 0) {
        setLookup((prev) => ({ ...prev, list: result.DT || [] }));
        setCaptcha((prev) => ({ ...prev, sessionId: null, base64: null }));
        setForm((prev) => ({ ...prev, captchaCode: '' }));
        loadCaptcha();
      } else {
        setLookup((prev) => ({
          ...prev,
          error: result?.EM || 'KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin GPLX.',
        }));

        if (result?.EM?.toLowerCase().includes('captcha')) {
          loadCaptcha();
        }
      }
    } catch {
      setLookup((prev) => ({ ...prev, error: 'Lá»—i káº¿t ná»‘i. Vui lÃ²ng thá»­ láº¡i sau.' }));
    } finally {
      setLookup((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="tc-wrapper">
      <div className="tc-banner">
        <div className="tc-banner-content">
          <img src="https://anh.csgt.vn/logo-csgt.png" alt="Logo" className="tc-banner-logo" />
          <div className="tc-banner-text">
            <span className="tc-banner-line1">Cá»”NG TRA Cá»¨U THÃ”NG TIN</span>
            <span className="tc-banner-line2">GIáº¤Y PHÃ‰P LÃI XE</span>
          </div>
        </div>
      </div>

      <div className="tc-container">
        <div className="tc-form-card">
          <div className="tc-card-accent" />
          <div className="tc-form-body">
            <div className="tc-section-title">
              <i className="material-icons">manage_search</i>
              Tra cá»©u giáº¥y phÃ©p lÃ¡i xe
            </div>

            <form onSubmit={handleGplxSearch}>
              <div className="tc-field-group">
                <label>Sá»‘ CMND / CCCD / Há»™ chiáº¿u</label>
                <div className="tc-input-wrapper">
                  <div className="tc-input-prefix"><i className="material-icons">badge</i></div>
                  <input
                    type="text"
                    className="tc-input-field"
                    placeholder="Nháº­p sá»‘ CCCD / CMND"
                    value={form.cccd}
                    onChange={(e) => setForm((prev) => ({ ...prev, cccd: e.target.value }))}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="tc-field-group">
                <label>MÃ£ xÃ¡c nháº­n (captcha)</label>
                <div className="tc-captcha-inline">
                  <div className="tc-captcha-img-wrap">
                    {captcha.loading ? (
                      <div className="tc-captcha-img tc-captcha-loading">
                        <span className="tc-spinner tc-spinner-dark" />
                      </div>
                    ) : captcha.base64 ? (
                      <img src={captcha.base64} alt="captcha" className="tc-captcha-img" />
                    ) : (
                      <div className="tc-captcha-img tc-captcha-empty" onClick={loadCaptcha}>Nhan de tai</div>
                    )}

                    <button
                      type="button"
                      className="tc-captcha-refresh"
                      onClick={loadCaptcha}
                      disabled={captcha.loading}
                      title="Lam moi captcha"
                    >
                      <i className="material-icons">refresh</i>
                    </button>
                  </div>

                  <input
                    type="text"
                    className="tc-captcha-input"
                    placeholder="Nháº­p mÃ£ trong áº£nh"
                    value={form.captchaCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, captchaCode: e.target.value }))}
                    maxLength={8}
                    autoComplete="off"
                  />
                </div>
              </div>

              {lookup.error && (
                <div className="tc-error-msg">
                  <i className="material-icons">error_outline</i>
                  {lookup.error}
                </div>
              )}

              <button type="submit" className="tc-submit-btn" disabled={lookup.loading || captcha.loading}>
                {lookup.loading ? (
                  <>
                    <span className="tc-spinner" /> Äang tra cá»©u...
                  </>
                ) : (
                  <>
                    <i className="material-icons">search</i> Tra cá»©u
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="tc-footer-note">
          <i className="material-icons">info</i>
          Dá»¯ liá»‡u Ä‘Æ°á»£c cáº­p nháº­t tá»« há»‡ thá»‘ng Cá»¥c CSGT - Bá»™ CÃ´ng An
        </div>

        {lookup.loading && (
          <div className="tc-gplx-loading">
            <div className="tc-spinner-large" />
            <p>Äang tra cá»©u du liá»‡u tá»« há»‡ thá»‘ng Cá»¥c CSGT...</p>
          </div>
        )}

        {lookup.searched && !lookup.loading && (
          <div className="tc-results">
            {lookup.list.length > 0 ? (
              <div className="gplx-list">
                {lookup.list.map((record, index) => (
                  <GplxCard key={record.id} record={record} index={index} />
                ))}
              </div>
            ) : (
              lookup.error && (
                <div className="tc-no-result">
                  <i className="material-icons">search_off</i>
                  <p>{lookup.error}</p>
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


