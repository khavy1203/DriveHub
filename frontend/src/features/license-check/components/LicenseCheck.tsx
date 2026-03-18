import React from 'react';
import './LicenseCheck.scss';

import GplxCard from './GplxCard';
import LicenseLookupForm from './LicenseLookupForm';
import useLicenseLookup from '../hooks/useLicenseLookup';

const LicenseCheck: React.FC = () => {
  const {
    register,
    errors,
    submitLookup,
    refreshCaptcha,
    captchaImageBase64,
    captchaLoading,
    lookupLoading,
    lookupError,
    hasSearched,
    lookupResults,
  } = useLicenseLookup();

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
              register={register}
              errors={errors}
              onSubmit={submitLookup}
              onRefreshCaptcha={refreshCaptcha}
              captchaImageBase64={captchaImageBase64}
              captchaLoading={captchaLoading}
              lookupLoading={lookupLoading}
              errorMessage={lookupError}
            />
          </div>
        </div>

        <div className="tc-footer-note">
          <i className="material-icons">info</i>
          Dữ liệu được cập nhật từ hệ thống Cục CSGT - Bộ Công An
        </div>

        {lookupLoading && (
          <div className="tc-gplx-loading">
            <div className="tc-spinner-large" />
            <p>Đang tra cứu dữ liệu từ hệ thống Cục CSGT...</p>
          </div>
        )}

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
      </div>
    </div>
  );
};

export default LicenseCheck;