// services/apiService.ts
import {ApiEndpoints} from "../interfaces";
  // Định nghĩa type cho mỗi unit, method và action
  type ApiUnit = "user" | "product";  // Có thể mở rộng thêm các unit khác
  
  type ApiMethod = "get" | "post" | "put" | "delete"; // Các phương thức HTTP
  
  // Dữ liệu API endpoints theo dạng object
  const api: ApiEndpoints = {
    user: {
      get: {
        login: '/api/user/login',
        profile: '/api/user/profile',
      },
      post: {
        login: '/api/user/login',
        register: '/api/user/register',
      },
    },
    product: {
      get: {
        list: '/api/product/list',
        detail: '/api/product/detail',
      },
      post: {
        create: '/api/product/create',
        update: '/api/product/update',
      },
    },
  };
  
  export default api;
  