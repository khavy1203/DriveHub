/**
 * Student feature types
 * @module features/student/types
 */

import { Subject } from '../../exam/types/exam.types';
import { Course, CourseStudent, Status } from './course.types';

export interface Student {
  IDThiSinh: number;
  HoTen: string | null;
  khoahoc_thisinh: CourseStudent;
  loaibangthi: string | null;
  SoCMT: string | null;
  NgaySinh: Date | null;
  Anh: string | null;
  IDprocesstest: number;
  processtest: ProcessTest;
  questionsTest?: Question[];
  test?: Test;
  subject: Subject;
  exams: Exam[] | null;
  rank: Rank;
  completionStatus: string | null;
  khoahoc?: Course;
  print?: number;
}

export interface ProcessTest {
  id: number;
  name: string;
}

export interface Rank {
  id: number;
  name: string;
  subjects?: Subject[];
}

export interface Question {
  id: number;
  number: number;
  URLImage?: string;
  answer?: number;
  options?: string[];
  tests?: { id: number; code: string }[];
}

export interface Test {
  id: number;
  IDSubject: number;
  code: string;
  subject?: {
    id: number;
    name: string;
    timeFinish: number;
  };
  questions?: Question[];
}

export interface Exam {
  id: number;
  IDThisinh: number;
  IDTest: number;
  answerlist: string;
  point: number;
  result: string;
  IDSubject: number;
  test?: Test;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
  username: string;
  address?: string | null;
  phone?: string | null;
  image?: string | ArrayBuffer | null;
  genderId?: number | null;
  groupId: number;
  googleId?: string | null;
  githubId?: string | null;
  facebookId?: string | null;
  active: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStatus {
  id: number;
  namestatus: string;
}
