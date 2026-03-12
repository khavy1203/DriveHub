/**
 * General application configuration constants
 * @module core/constants/config
 */

export const APP_CONFIG = {
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  LOCALE: 'vi-VN',
  PAGE_SIZE: 20,
  MAX_FILE_SIZE_MB: 10,
} as const;

export const THEME = {
  COLORS: {
    PRIMARY: '#007bff',
    SECONDARY: '#6c757d',
    SUCCESS: '#28a745',
    ERROR: '#dc3545',
    WARNING: '#ffc107',
  },
} as const;


export const TRAFFIC_BASE_URL = 'https://api.phatnguoi.vn/web/tra-cuu';