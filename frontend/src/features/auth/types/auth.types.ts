/**
 * Auth feature types
 * @module features/auth/types
 */

export interface AuthContextType {
  isAuthenticated: boolean;
  role: string | null;
  displayName: string | null;
  setAuth: (token: string, role: string, displayName?: string) => void;
  logout: () => void;
  getToken: () => string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  groupWithRoles: {
    id: number;
    name: string;
    description: string | null;
    roles: string[] | null;
  };
  email: string;
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  displayName: string | null;
  token: string | null;
}
