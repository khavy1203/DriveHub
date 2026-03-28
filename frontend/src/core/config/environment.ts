/**
 * Environment configuration for DriveHub application
 * @module core/config/environment
 */

export interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
}

export type BuildEnvironment = 
  | 'development' 
  | 'production' 
  | 'buildlocal' 
  ;

export const ENVIRONMENT_CONFIGS: Record<BuildEnvironment, EnvironmentConfig> = {
  development: {
    API_BASE_URL: 'http://localhost:8080',
    WS_BASE_URL: 'ws://localhost:8080/ws/student-status',
  },
  production: {
    // Same-origin: nginx proxies /api/* → backend. No CORS needed.
    API_BASE_URL: process.env.REACT_APP_API_URL || '',
    WS_BASE_URL: process.env.REACT_APP_WS_URL || `${typeof window !== 'undefined' ? window.location.origin.replace(/^http/, 'ws') : 'wss://driverhub.io.vn'}/ws/student-status`,
  },
  buildlocal: {
    API_BASE_URL: 'http://192.168.1.99:8080',
    WS_BASE_URL: 'ws://192.168.1.99:8080/ws/student-status',
  },
};

export const getCurrentEnvironment = (): BuildEnvironment => {
  return (process.env.REACT_APP_BUILD as BuildEnvironment) || 'development';
};

export const getConfig = (): EnvironmentConfig => {
  const env = getCurrentEnvironment();
  return ENVIRONMENT_CONFIGS[env] || ENVIRONMENT_CONFIGS.development;
};

export const isBuildLocal = (): boolean => {
  return getCurrentEnvironment() === 'buildlocal';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};
