export interface Rank {
  id: number;
  name: string;
  subjects?: Subject[]
}

export interface Subject {
  IDrank: number;            // ID của rank (khóa ngoại từ bảng Rank)
  id: number;                // ID của subject
  name: string;              // Tên môn học
  numberofquestion: number;  // Số lượng câu hỏi
  nameEx: string;            // Tên bài kiểm tra liên quan
  threshold: number ;         // Điểm chuẩn (số)
  showsubject: boolean;      // Hiển thị môn học hay không
  timeFinish: number;        // Thời gian hoàn thành bài thi (phút)
  createdAt: string | null;    // Thời gian tạo, có thể là null
  updatedAt: string | null;  // Thời gian cập nhật, có thể là null
}
