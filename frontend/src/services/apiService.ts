import instance from "../axios";
import { AxiosResponse } from "axios";

interface ApiResponse<T> {
  DT: T;
  EM: string;
  EC?: number;
}

class ApiService {
  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> {
    console.log("check ApiResponse", response);
    return response.data;
  }

  async request<T>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: Record<string, any>,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const response = await instance.request<ApiResponse<T>>({
      method,
      url,
      data,
      params,
    });
    return this.handleResponse(response);
  }

  async get<T>(url: string, params?: Record<string, any>) {
    return this.request<T>("get", url, undefined, params);
  }

  async post<T>(url: string, data?: Record<string, any>) {
    return this.request<T>("post", url, data);
  }

  async put<T>(url: string, data?: Record<string, any>) {
    return this.request<T>("put", url, data);
  }

  async delete<T>(url: string) {
    return this.request<T>("delete", url);
  }
}

const apiService = new ApiService();
export default apiService;
