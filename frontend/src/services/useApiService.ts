import instance from "../axios";
import { useLoading } from "../context/LoadingContext";

const useApiService = () => {
  const { setLoading } = useLoading();

  const get = async <T>(url: string, options?: { params?: object }): Promise<T> => {
    setLoading(true);
    try {
        const response = await instance.get<T>(url, { params: options?.params });
        return response.data;
    } catch (error) {
        // Nếu có lỗi, toast sẽ tự động hiển thị từ response interceptor trong axios
        throw error;
    } finally {
        setLoading(false);
    }
};


  const post = async <T>(url: string, data?: object): Promise<T> => {
    setLoading(true);
    try {
      const response = await instance.post<T>(url, data);
      return response.data;
    } catch (error) {
      // Nếu có lỗi, toast sẽ tự động hiển thị từ response interceptor trong axios
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const put = async <T>(url: string, data?: object): Promise<T> => {
    setLoading(true);
    try {
      const response = await instance.put<T>(url, data);
      return response.data;
    } catch (error) {
      // Nếu có lỗi, toast sẽ tự động hiển thị từ response interceptor trong axios
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const del = async <T>(url: string): Promise<T> => {
    setLoading(true);
    try {
      const response = await instance.delete<T>(url);
      return response.data;
    } catch (error) {
      // Nếu có lỗi, toast sẽ tự động hiển thị từ response interceptor trong axios
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { get, post, put, del };
};

export default useApiService;
