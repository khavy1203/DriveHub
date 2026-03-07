import { ThiSinh } from "./user.interface";
export interface Course {
  IDKhoaHoc: string;
  TenKhoaHoc: string;
  IDDonVi?: string;
  NgayThi?: Date;
  NamHoc?: string;
  Thi?: string;
  HoiDong?: string;
  TrungTam?: string;
  TrangThai?: number;
}

export interface CourseStudent {
  ID: number;
  IDKhoaHoc: string;
  IDThiSinh: number;
  SoBaoDanh: string;
  payment: boolean;
  moneypayment: number;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface Status {
  id: number;
  namestatus: string;
}

export interface KhoaHoc {
  IDKhoaHoc: string; // Khóa chính, không được null
  TenKhoaHoc?: string | null; // Tên khóa học, có thể null
  IDDonVi?: string | null; // ID đơn vị, có thể null
  NgayThi?: Date | null; // Ngày thi, kiểu Date, có thể null
  NamHoc?: string | null; // Năm học, có thể null
  Thi?: string | null; // Thi, có thể null
  HoiDong?: string | null; // Hội đồng, có thể null
  TrungTam?: string | null; // Trung tâm, có thể null
  TrangThai?: number | null; // Trạng thái, có thể null

  // Quan hệ với thực thể khác
  thisinh?: ThiSinh[]; // Một khóa học có thể có nhiều thí sinh
}

export interface KhoahocThisinh {
  ID: number; // Khóa chính tự động tăng
  IDKhoaHoc?: string | null; // Mã khóa học
  IDThiSinh: number | null; // ID của thí sinh
  SoBaoDanh: number | null; // Số báo danh (lấy từ chuỗi và chuyển sang số)
  IDstatus?: number | null; // Trạng thái
  stt?: number | null; // Số thứ tự
  payment?: boolean | null; // Trạng thái thanh toán
  moneypayment?: number | null; // Số tiền đã thanh toán
  createdAt: Date; // Thời gian tạo bản ghi
  updatedAt: Date; // Thời gian cập nhật bản ghi

  // Quan hệ
  thisinh?: ThiSinh | null; // Tham chiếu đến bảng thisinh
  khoahoc?: KhoaHoc | null; // Tham chiếu đến bảng khoahoc
  status?: Status | null; // Tham chiếu đến bảng status
}