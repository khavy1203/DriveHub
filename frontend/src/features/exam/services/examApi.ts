/**
 * Exam API endpoints and services
 * @module features/exam/services/examApi
 */

import { apiService } from '../../../shared/services/apiService';
import { ApiResponse } from '../../../core/types/api.types';
import { ExamResult } from '../types/exam.types';

export const EXAM_ENDPOINTS = {
  CREATE: '/api/exam/create-exam',
  GET_TEST: (subjectId: number) => `/api/subject/get-test/${subjectId}`,
  GET_TEST_DETAIL: (testId: number) => `/api/test/get-test/${testId}`,
} as const;

export interface CreateExamPayload {
  IDThisinh: number;
  IDTest: number;
  answerlist: string;
  point: number;
  result: string;
  IDSubject: number;
}

export const examApi = {
  createExam: async (payload: CreateExamPayload): Promise<ApiResponse<ExamResult>> => {
    return apiService.post<ExamResult>(EXAM_ENDPOINTS.CREATE, payload as unknown as Record<string, unknown>);
  },

  getTestsBySubject: async (subjectId: number): Promise<ApiResponse<unknown[]>> => {
    return apiService.get(EXAM_ENDPOINTS.GET_TEST(subjectId));
  },

  getTestDetail: async (testId: number): Promise<ApiResponse<unknown[]>> => {
    return apiService.get(EXAM_ENDPOINTS.GET_TEST_DETAIL(testId));
  },
};

export default examApi;
