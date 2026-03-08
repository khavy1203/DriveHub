/**
 * Course related types
 * @module features/student/types/course
 */

export interface Course {
  IDKhoaHoc: string;
  TenKhoaHoc?: string | null;
  IDDonVi?: string | null;
  NgayThi?: Date | null;
  NamHoc?: string | null;
  Thi?: string | null;
  HoiDong?: string | null;
  TrungTam?: string | null;
  TrangThai?: number | null;
}

export interface CourseStudent {
  ID: number;
  IDKhoaHoc?: string | null;
  IDThiSinh: number | null;
  SoBaoDanh: number | null;
  IDstatus?: number | null;
  stt?: number | null;
  payment?: boolean | null;
  moneypayment?: number | null;
  createdAt: Date;
  updatedAt: Date;
  khoahoc?: Course | null;
  status?: Status | null;
}

export interface Status {
  id: number;
  namestatus: string;
}
