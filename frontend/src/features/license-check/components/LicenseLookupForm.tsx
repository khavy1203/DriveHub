import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { LicenseLookupFormValues } from '../types';

interface LicenseLookupFormProps {
  captchaImageBase64: string | null;
  captchaLoading: boolean;
  lookupLoading: boolean;
  errorMessage: string | null;
  prefilledCaptchaCode: string;
  onRefreshCaptcha: () => void;
  onSubmitLookup: (values: LicenseLookupFormValues) => void;
}

const LicenseLookupForm: React.FC<LicenseLookupFormProps> = ({
  captchaImageBase64,
  captchaLoading,
  lookupLoading,
  errorMessage,
  prefilledCaptchaCode,
  onRefreshCaptcha,
  onSubmitLookup,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<LicenseLookupFormValues>({
    defaultValues: {
      identityNumber: '',
      captchaCode: '',
    },
  });

  useEffect(() => {
    setValue('captchaCode', prefilledCaptchaCode || '');
  }, [prefilledCaptchaCode, setValue]);

  const handleRefreshCaptcha = () => {
    resetField('captchaCode');
    onRefreshCaptcha();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitLookup)}>
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
              <div className="tc-captcha-img tc-captcha-empty" onClick={handleRefreshCaptcha}>Nhấn để tải</div>
            )}

            <button
              type="button"
              className="tc-captcha-refresh"
              onClick={handleRefreshCaptcha}
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