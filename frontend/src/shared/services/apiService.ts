/**
 * API Service for making HTTP requests
 * @module shared/services/apiService
 */

import httpClient from './httpClient';
import { AxiosResponse } from 'axios';
import { ApiResponse } from '../../core/types/api.types';

class ApiService {
  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> {
    return response.data;
  }

  async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: Record<string, unknown>,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.request<ApiResponse<T>>({
      method,
      url,
      data,
      params,
    });
    return this.handleResponse(response);
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>('get', url, undefined, params);
  }

  async post<T>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data);
  }

  async put<T>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data);
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url);
  }
}

export const apiService = new ApiService();
export default apiService;
