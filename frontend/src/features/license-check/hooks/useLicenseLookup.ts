import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { getConfig } from 'src/core/config/environment';
import { useApi } from 'src/shared/hooks';

import {
  CaptchaSessionResponse,
  CaptchaUiState,
  LicenseLookupFormValues,
  LicenseLookupResponse,
  LicenseLookupUiState,
  mapLicenseRecord,
} from '../types';

const useLicenseLookup = () => {
  const { post } = useApi();
  const apiBaseUrl = getConfig().API_BASE_URL;

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
        setCaptchaState({
          sessionId: data.DT.sessionId,
          base64: data.DT.captchaBase64 || null,
          loading: false,
        });
        setPrefilledCaptchaCode(data.DT.autoSolvedCode || '');
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

  useEffect(() => {
    setValue('captchaCode', prefilledCaptchaCode || '');
  }, [prefilledCaptchaCode, setValue]);

  const submitLookup = handleSubmit(async (values) => {
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
        setLookupState((prev) => ({
          ...prev,
          list: (result.DT || []).map(mapLicenseRecord),
        }));
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
  });

  const refreshCaptcha = useCallback(() => {
    resetField('captchaCode');
    loadCaptcha();
  }, [loadCaptcha, resetField]);

  return {
    register,
    errors,
    submitLookup,
    refreshCaptcha,
    captchaImageBase64: captchaState.base64,
    captchaLoading: captchaState.loading,
    lookupLoading: lookupState.loading,
    lookupError: lookupState.error,
    hasSearched: lookupState.searched,
    lookupResults: lookupState.list,
  };
};

export default useLicenseLookup;