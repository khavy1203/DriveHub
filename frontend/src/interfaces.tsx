/**
 * Backward compatibility - Re-exports from new structure
 * @deprecated Use direct imports from features/ or core/ instead
 */

// API Types
export type { ApiResponse } from './core/types/api.types';

// Student Types
export type {
  Student as ThiSinh,
  Student,
  ProcessTest,
  Rank,
  Question,
  Test,
  Exam,
  User,
  UserStatus
} from './features/student/types/student.types';

// Course Types
export type {
  Course,
  CourseStudent,
  Status
} from './features/student/types/course.types';

// Exam Types
export type {
  Subject,
  ExamQuestion,
  ExamTest,
  ExamResult
} from './features/exam/types/exam.types';

export interface ApiEndpoints {
  [key: string]: {
    [method: string]: {
      [action: string]: string;
    };
  };
}

