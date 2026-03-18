import React, { FormEventHandler } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

import { LicenseLookupFormValues } from '../types';

interface LicenseLookupFormProps {
  register: UseFormRegister<LicenseLookupFormValues>;
  errors: FieldErrors<LicenseLookupFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onRefreshCaptcha: () => void;
  captchaImageBase64: string | null;
  captchaLoading: boolean;
  lookupLoading: boolean;
  errorMessage: string | null;
}

const LicenseLookupForm: React.FC<LicenseLookupFormProps> = ({
  register,
  errors,
  onSubmit,
  onRefreshCaptcha,
  captchaImageBase64,
  captchaLoading,
  lookupLoading,
  errorMessage,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="tc-field-group">
        <label>Số CMND / CCCD / Hộ chiếu</label>
        <div className="tc-input-wrapper">
          <div className="tc-input-prefix"><i className="material-icons">badge</i></div>
          <input
            type="text"
            className="tc-input-field"
            placeholder="Nhập số CCCD / CMND"
            maxLength={20}
            {...register('identityNumber', {
              required: 'Vui lòng nhập số CMND/CCCD.',
            })}
          />
        </div>
      </div>

      <div className="tc-field-group">
        <label>Mã xác nhận (captcha)</label>
        <div className="tc-captcha-inline">
          <div className="tc-captcha-img-wrap">
            {captchaLoading ? (
              <div className="tc-captcha-img tc-captcha-loading">
                <span className="tc-spinner tc-spinner-dark" />
              </div>
            ) : captchaImageBase64 ? (
              <img src={captchaImageBase64} alt="captcha" className="tc-captcha-img" />
            ) : (
              <div className="tc-captcha-img tc-captcha-empty" onClick={onRefreshCaptcha}>Nhấn để tải</div>
            )}

            <button
              type="button"
              className="tc-captcha-refresh"
              onClick={onRefreshCaptcha}
              disabled={captchaLoading}
              title="Làm mới captcha"
            >
              <i className="material-icons">refresh</i>
            </button>
          </div>

          <input
            type="text"
            className="tc-captcha-input"
            placeholder="Nhập mã trong ảnh"
            maxLength={8}
            autoComplete="off"
            {...register('captchaCode', {
              required: 'Vui lòng nhập mã captcha.',
            })}
          />
        </div>
      </div>

      {(errors.identityNumber || errors.captchaCode || errorMessage) && (
        <div className="tc-error-msg">
          <i className="material-icons">error_outline</i>
          {errors.identityNumber?.message || errors.captchaCode?.message || errorMessage}
        </div>
      )}

      <button type="submit" className="tc-submit-btn" disabled={lookupLoading || captchaLoading}>
        {lookupLoading ? (
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
  );
};

export default LicenseLookupForm;