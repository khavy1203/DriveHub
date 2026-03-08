/**
 * Dashboard types barrel export
 * @module features/dashboard/types
 */

export interface DashboardStats {
  totalStudents: number;
  passedExams: number;
  failedExams: number;
  pendingExams: number;
}

export interface ExamResultRow {
  id: number;
  studentName: string;
  examDate: string;
  subject: string;
  score: number;
  result: 'PASS' | 'FAIL';
}
