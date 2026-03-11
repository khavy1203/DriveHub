export interface ViolationRecord {
  ngay_vi_pham?: string;
  hanh_vi?: string;
  dia_diem?: string;
  trang_thai?: string;
  don_vi_phat_hien?: string;
  don_vi_giai_quyet?: string;
  mau_bien?: string;
  diachi_diem_giaiquyet?: string;
}

export interface TrafficCheckResponse {
  success: boolean;
  data?: ViolationRecord[];
  message?: string;
}
