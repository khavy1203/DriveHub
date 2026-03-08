/**
 * Student API endpoints and services
 * @module features/student/services/studentApi
 */

import { apiService } from '../../../shared/services/apiService';
import { ApiResponse } from '../../../core/types/api.types';
import { Student, Course, Status } from '../types';

export const STUDENT_ENDPOINTS = {
  LIST: '/api/students',
  GET_BY_ID: (id: number) => `/api/students?IDThiSinh=${id}`,
  UPDATE_PROCESS: '/api/students/update-processtest',
  COURSES: '/api/course',
  STATUS: '/api/status',
} as const;

export const studentApi = {
  getStudents: async (): Promise<ApiResponse<Student[]>> => {
    return apiService.get<Student[]>(STUDENT_ENDPOINTS.LIST);
  },

  getStudentById: async (id: number): Promise<ApiResponse<Student[]>> => {
    return apiService.get<Student[]>(STUDENT_ENDPOINTS.GET_BY_ID(id));
  },

  updateProcessTest: async (
    IDThiSinh: number,
    processtest: number
  ): Promise<ApiResponse<unknown>> => {
    return apiService.post(STUDENT_ENDPOINTS.UPDATE_PROCESS, {
      IDThiSinh,
      processtest,
    });
  },

  getCourses: async (): Promise<ApiResponse<Course[]>> => {
    return apiService.get<Course[]>(STUDENT_ENDPOINTS.COURSES);
  },

  getStatuses: async (): Promise<ApiResponse<Status[]>> => {
    return apiService.get<Status[]>(STUDENT_ENDPOINTS.STATUS);
  },
};

export default studentApi;
