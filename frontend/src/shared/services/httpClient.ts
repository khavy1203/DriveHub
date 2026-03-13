/**
 * HTTP Client configuration using Axios
 * @module shared/services/httpClient
 */

import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-toastify';
import { 
  ENVIRONMENT_CONFIGS, 
  getCurrentEnvironment, 
  isDevelopment 
} from '../../core/config/environment';
import { MESSAGES } from '../../core/constants/messages';


/**
 * Get the base URL based on environment
 */
const getBaseUrl = (): string => {
  const env = getCurrentEnvironment();
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
  withCredentials: true,
});

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

// Request interceptor - attach auth token from localStorage
httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default httpClient;
