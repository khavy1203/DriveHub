export interface GplxLiveData {
  so_gplx?: string;
  ho_va_ten?: string;
  ngay_sinh?: string;
  noi_cap?: string;
  ngay_cap?: string;
  ngay_het_han?: string;
  hang_gplx?: string;
  ngay_trung_tuyen?: string;
  status?: string;
}

export interface GplxRecord {
  id: number;
  ma_dang_ky: string;
  ho_ten: string;
  ngay_sinh: string;
  so_cmnd_cccd: string;
  so_gplx: string;
  hang: string;
  ket_qua_xac_thuc: string;
  ly_do_tu_choi: string;
  live?: GplxLiveData | null;
  liveError?: string;
}

export interface CaptchaSessionData {
  sessionId: string;
  captchaBase64?: string | null;
  autoSolvedCode?: string;
}

export interface CaptchaSessionResponse {
  EC: number;
  EM?: string;
  DT?: CaptchaSessionData;
}

export interface GplxLookupResponse {
  EC: number;
  EM?: string;
  DT?: GplxRecord[];
}

export interface GplxCardProps {
  record: GplxRecord;
  index: number;
}


export interface LicenseCheckFormState {
  cccd: string;
  captchaCode: string;
}

export interface CaptchaState {
  sessionId: string | null;
  base64: string | null;
  loading: boolean;
}

export interface LookupState {
  loading: boolean;
  list: GplxRecord[];
  error: string | null;
  searched: boolean;
}

