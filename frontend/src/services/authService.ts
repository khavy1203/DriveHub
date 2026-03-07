import useApiService from "./useApiService";
import { ApiResponse } from "../interfaces"
import apiGeneral from "../api/apiEndPointGeneral";
const { get, post, put , del } = useApiService();
// Hàm login API
const handleLoginApi = async (email: string, password: string): Promise<ApiResponse> => {
  try {
    const response = await post<ApiResponse>(apiGeneral.user.post.login, {
      email,
      password,
    });
    return response;
  } catch (error: any) {
    console.error("Error calling login API:", error);
    throw new Error(
      error.response?.data?.EM || "Failed to login. Please try again."
    );
  }
};

// Hàm logout API
const handleLogoutApi = async (): Promise<void> => {
  try {
    await post<ApiResponse>("/api/logout");
  } catch (error: any) {
    console.error("Error calling logout API:", error);
    throw new Error("Failed to logout. Please try again.");
  }
};

module.exports = {
  handleLoginApi,
  handleLogoutApi
}