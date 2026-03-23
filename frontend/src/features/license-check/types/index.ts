export interface ApiResponseEnvelope<T> {
  EC: number;
  EM?: string;
  DT?: T;
}

export interface LicenseLiveInfoApi {
  so_gplx?: string;
  so_phoi?: string;
  ho_va_ten?: string;
  ngay_sinh?: string;
  noi_cap?: string;
  ngay_cap?: string;
  ngay_het_han?: string;
  hang_gplx?: string;
  ngay_trung_tuyen?: string;
  status?: string;
}

export interface LicenseRecordApi {
  id: number;
  ma_dang_ky: string;
  ho_ten: string;
  ngay_sinh: string;
  so_cmnd_cccd: string;
  so_gplx: string;
  hang: string;
  ket_qua_xac_thuc: string;
  ly_do_tu_choi: string;
  live?: LicenseLiveInfoApi | null;
  loaiXe?: string;
  liveError?: string;
}

export interface LicenseLiveInfo {
  licenseNumber?: string;
  foilNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  licenseClass?: string;
  passingDate?: string;
  status?: string;
}

export interface LicenseRecord {
  id: number;
  registrationCode: string;
  fullName: string;
  dateOfBirth: string;
  identityNumber: string;
  licenseNumber: string;
  licenseClass: string;
  verificationResult: string;
  rejectionReason: string;
  liveInfo?: LicenseLiveInfo | null;
  loaiXe?: string;
  liveError?: string;
}

export interface CaptchaSessionData {
  sessionId: string;
  captchaBase64?: string | null;
  autoSolvedCode?: string;
  sessionId2?: string;
}

export type CaptchaSessionResponse = ApiResponseEnvelope<CaptchaSessionData>;
export type LicenseLookupResponse = ApiResponseEnvelope<LicenseRecordApi[]>;

export interface GplxCardProps {
  record: LicenseRecord;
  index: number;
}

export interface LicenseLookupFormValues {
  identityNumber: string;
  captchaCode: string;
}

export interface CaptchaUiState {
  sessionId: string | null;
  base64: string | null;
  loading: boolean;
}

export interface LicenseLookupUiState {
  loading: boolean;
  list: LicenseRecord[];
  error: string | null;
  searched: boolean;
}

export const mapLicenseLiveInfo = (api?: LicenseLiveInfoApi | null): LicenseLiveInfo | null => {
  if (!api) return null;

  return {
    licenseNumber: api.so_gplx,
    foilNumber: api.so_phoi,
    fullName: api.ho_va_ten,
    dateOfBirth: api.ngay_sinh,
    issuedBy: api.noi_cap,
    issueDate: api.ngay_cap,
    expiryDate: api.ngay_het_han,
    licenseClass: api.hang_gplx,
    passingDate: api.ngay_trung_tuyen,
    status: api.status,
  };
};

export const mapLicenseRecord = (api: LicenseRecordApi): LicenseRecord => ({
  id: api.id,
  registrationCode: api.ma_dang_ky,
  fullName: api.ho_ten,
  dateOfBirth: api.ngay_sinh,
  identityNumber: api.so_cmnd_cccd,
  licenseNumber: api.so_gplx,
  licenseClass: api.hang,
  verificationResult: api.ket_qua_xac_thuc,
  rejectionReason: api.ly_do_tu_choi,
  liveInfo: mapLicenseLiveInfo(api.live),
  loaiXe: api.loaiXe,
  liveError: api.liveError,
});