import { Subject } from "./rank.interface";
import { Question, Test } from "./test.interface";
import { KhoaHoc, KhoahocThisinh } from "./course.interface";

export interface User {
  id: number; // ID tự động tăng
  email: string; // Email người dùng
  password: string; // Mật khẩu người dùng (hashed)
  username: string; // Tên người dùng
  address?: string | null; // Địa chỉ có thể null
  phone?: string | null; // Số điện thoại có thể null
  image?: string | ArrayBuffer | null; // Ảnh dạng blob hoặc null
  genderId?: number | null; // ID giới tính (liên kết với bảng giới tính)
  groupId: number; // ID nhóm (liên kết với bảng nhóm)
  googleId?: string | null; // ID Google có thể null
  githubId?: string | null; // ID GitHub có thể null
  facebookId?: string | null; // ID Facebook có thể null
  active: number; // Trạng thái kích hoạt (1 = active, 0 = inactive)
  createdAt?: Date; // Thời gian tạo (do Sequelize tự động thêm)
  updatedAt?: Date; // Thời gian cập nhật (do Sequelize tự động thêm)
}


export interface ThiSinh {
  IDThiSinh: number;
  HoTen: string | null;
  khoahoc_thisinh: KhoahocThisinh;
  loaibangthi: string | null;
  SoCMT: string | null;
  NgaySinh: Date | null;
  Anh: string | null;
  IDprocesstest: number;
  processtest: {
    id: number;
    name: string;
  };
  questionsTest?: Question[];
  test?: Test;
  subject: Subject;
  exams: Exam[] | null;
  rank: {
    id: number;
    name: string;
    subjects?: Subject[];
  };
  completionStatus: string | null; // "Hoàn thành" hoặc "Chưa hoàn thành",
  khoahoc?: {
    IDKhoaHoc: string;
    TenKhoaHoc: string;
    IDDonVi: number | null;
    NgayThi: Date | null;
    NamHoc: string | null;
    Thi: any | null;
    HoiDong: any | null;
    TrungTam: string;
    TrangThai: number;
  };
  print?: number
}

export interface Exam {
  id: number; // ID của bài thi
  IDThisinh: number; // ID của thí sinh
  IDTest: number; // ID của bài kiểm tra
  answerlist: string; // Danh sách các câu trả lời
  point: number; // Điểm số của bài thi
  result: string; // Kết quả ("ĐỖ", "TRƯỢT", v.v.)
  IDSubject: number; // ID của môn thi
  test?: Test; // Thông tin bài kiểm tra liên quan
  subject?: Subject; // Thông tin môn học liên quan
  createdAt: string; // Thời gian tạo bài thi (ISO string)
  updatedAt: string; // Thời gian cập nhật bài thi (ISO string)
  note?:string
}
export interface groupWithRoles {
  id: number;
  name: string | null;
  description: string | null;
  roles: [] | null
}

export interface UserStatus {
  id: number;
  namestatus: string;
}
