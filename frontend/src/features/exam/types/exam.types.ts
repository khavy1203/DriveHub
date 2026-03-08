/**
 * Exam feature types
 * @module features/exam/types
 */

export interface Subject {
  id: number;
  IDrank: number;
  name: string;
  numberofquestion: number;
  nameEx: string;
  threshold: number;
  showsubject: boolean;
  timeFinish: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ExamQuestion {
  id: number;
  number: number;
  URLImage?: string;
  answer?: number;
  options: string[];
  tests?: { id: number; code: string }[];
}

export interface ExamTest {
  id: number;
  IDSubject: number;
  code: string;
  subject?: Subject;
  questions?: ExamQuestion[];
}

export interface ExamResult {
  id: number;
  IDThisinh: number;
  IDTest: number;
  answerlist: string;
  point: number;
  result: 'ĐẠT' | 'TRƯỢT';
  IDSubject: number;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface ExamState {
  currentQuestion: number;
  selectedOptions: number[][];
  timeRemaining: number;
  isFinished: boolean;
  showResult: boolean;
  score: number;
}

export interface ExamStudentInfo {
  studentID: number;
  fullName: string;
  subject: string;
  rank: string;
  test: string;
  CCCD: string;
  courseID: string;
}
