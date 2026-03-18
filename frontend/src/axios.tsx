import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-toastify';
import { getConfig } from './core/config/environment';

const getBaseUrl = (): string => getConfig().API_BASE_URL;

const instance: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Response interceptor để xử lý lỗi và hiển thị thông báo toast
instance.interceptors.response.use(
  (response) => {
    return response; // Trả lại response khi thành công
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.EM || 'Đã có lỗi xảy ra. Vui lòng thử lại!';
      // Hiển thị thông báo toast khi có lỗi
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      
      // Các mã lỗi thông dụng
      if (status === 401) {
        console.error("Unauthorized - Chưa đăng nhập hoặc hết hạn token");
      } else if (status === 403) {
        console.error("Forbidden - Không có quyền truy cập");
      } else if (status >= 500) {
        console.error("Server error - Có lỗi xảy ra từ phía máy chủ");
      }
    } else {
      const baseUrl = getBaseUrl();
      const requestUrl = error?.config?.url || '';
      const method = (error?.config?.method || 'GET').toUpperCase();
      const fullApiUrl = `${error?.config?.baseURL || baseUrl}${requestUrl}`;
      const debugMsg = `Lỗi mạng - Không thể kết nối\n${method} ${fullApiUrl}`;
      console.error(debugMsg);
      toast.error(debugMsg, {
        position: "top-right",
        autoClose: 10000,
        style: { whiteSpace: 'pre-line', fontSize: '12px' },
      });
    }
    return Promise.reject(error);
  }
);

export default instance;
