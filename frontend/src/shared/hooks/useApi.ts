/**
 * Custom hook for API calls
 * @module shared/hooks/useApi
 */

import { useCallback } from 'react';
import httpClient from '../services/httpClient';

export interface UseApiReturn {
  get: <T>(url: string, options?: { params?: object }) => Promise<T>;
  post: <T>(url: string, data?: object) => Promise<T>;
  put: <T>(url: string, data?: object) => Promise<T>;
  del: <T>(url: string) => Promise<T>;
}

export const useApi = (): UseApiReturn => {
  const get = useCallback(async <T>(url: string, options?: { params?: object }): Promise<T> => {
    const response = await httpClient.get<T>(url, { params: options?.params });
    return response.data;
  }, []);

  const post = useCallback(async <T>(url: string, data?: object): Promise<T> => {
    const response = await httpClient.post<T>(url, data);
    return response.data;
  }, []);

  const put = useCallback(async <T>(url: string, data?: object): Promise<T> => {
    const response = await httpClient.put<T>(url, data);
    return response.data;
  }, []);

  const del = useCallback(async <T>(url: string): Promise<T> => {
    const response = await httpClient.delete<T>(url);
    return response.data;
  }, []);

  return { get, post, put, del };
};

export default useApi;
