/**
 * Auth API endpoints and services
 * @module features/auth/services/authApi
 */

import { apiService } from '../../../shared/services/apiService';
import { ApiResponse } from '../../../core/types/api.types';
import { LoginResponse } from '../types/auth.types';

export const AUTH_ENDPOINTS = {
  LOGIN: '/api/user/login',
  LOGOUT: '/api/logout',
  REGISTER: '/api/user/register',
  PROFILE: '/api/user/profile',
} as const;

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return apiService.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, { email, password });
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiService.post<void>(AUTH_ENDPOINTS.LOGOUT);
  },

  getProfile: async (): Promise<ApiResponse<unknown>> => {
    return apiService.get(AUTH_ENDPOINTS.PROFILE);
  },
};

export default authApi;
