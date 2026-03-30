/**
 * Auth feature types
 * @module features/auth/types
 */

export interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userId: number | null;
  role: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  setAuth: (token: string, role: string, displayName?: string, avatarUrl?: string | null, userId?: number | null) => void;
  logout: () => void;
  getToken: () => string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  userId?: number | null;
  groupWithRoles: {
    id: number;
    name: string;
    description: string | null;
    roles: string[] | null;
  };
  email: string;
  username: string;
  avatarUrl?: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  token: string | null;
}
