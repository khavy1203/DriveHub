/**
 * HTTP Client configuration using Axios
 * @module shared/services/httpClient
 */

import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-toastify';
import Cookies from 'universal-cookie';
import { 
  ENVIRONMENT_CONFIGS, 
  getCurrentEnvironment, 
  isDevelopment 
} from '../../core/config/environment';
import { MESSAGES } from '../../core/constants/messages';

const cookies = new Cookies();

/**
 * Check if the device is mobile
 */
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Get the base URL based on device and environment
 */
const getBaseUrl = (): string => {
  const env = getCurrentEnvironment();
  if (isMobileDevice() && env === 'development') {
    return 'http://192.168.1.254:8080';
  }
  return ENVIRONMENT_CONFIGS[env]?.API_BASE_URL || 'http://localhost:8080';
};

/**
 * Toast configuration
 */
const TOAST_CONFIG = {
  position: 'top-right' as const,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/**
 * Create and configure Axios instance
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
});

// Request interceptor - attach token to requests
httpClient.interceptors.request.use(
  (config) => {
    const token = cookies.get('jwt') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and show toast notifications
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.EM || MESSAGES.ERROR.GENERIC;

      toast.error(errorMessage, TOAST_CONFIG);

      if (isDevelopment()) {
        if (status === 401) {
          console.error(MESSAGES.ERROR.UNAUTHORIZED);
        } else if (status === 403) {
          console.error(MESSAGES.ERROR.FORBIDDEN);
        } else if (status >= 500) {
          console.error(MESSAGES.ERROR.SERVER);
        }
      }
    } else {
      toast.error(MESSAGES.ERROR.NETWORK, TOAST_CONFIG);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
