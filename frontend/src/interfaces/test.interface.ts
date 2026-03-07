export interface Subject1 {
  IDThiSinh: number;
  HoTen: string | null;
  khoahoc_thisinh?: {
    SoBaoDanh: string | null;
    payment: boolean;
    IDstatus: number | null;
    stt: number | null;
  };
  loaibangthi: string | null
}

export interface TestQuestion {
  numberquestion: number; // Câu hỏi số bao nhiêu trong bài thi
  IDTest: number; // Khóa ngoại liên kết đến bài thi (test)
  IDQuestion: number; // Khóa ngoại liên kết đến câu hỏi (question)
  IDSubject: number; // Khóa ngoại liên kết đến môn học (subject)
  subject?: {
    id: number; // ID của môn học
    name: string; // Tên môn học
  };
}

export interface Test {
  id: number; // ID của bài thi
  IDSubject: number; // Khóa ngoại liên kết đến môn học (subject)
  code: string; // Mã bài thi
  subject?: {
    id: number; // ID của môn học
    name: string; // Tên môn học
    timeFinish: number
  };
  questions?: {
    id: number; // ID của câu hỏi
    number: number; // Số thứ tự câu hỏi
    URLImage?: string; // Đường dẫn đến hình ảnh (nếu có)
    answer?: number; // Đáp án của câu hỏi
  }[];
}

export interface Question {
  options: any;
  id: number; // ID của câu hỏi
  number: number; // Số thứ tự câu hỏi trong đề thi
  URLImage?: string; // Đường dẫn đến hình ảnh của câu hỏi (nếu có)
  answer?: number; // Đáp án của câu hỏi
  tests?: {
    id: number; // ID của bài thi
    code: string; // Mã bài thi
  }[];
}