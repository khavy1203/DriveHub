/**
 * Authentication context and hook
 * @module features/auth/hooks/useAuth
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AuthContextType } from '../types/auth.types';
import { getConfig } from '../../../core/config/environment';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEYS = {
  token: 'auth_token',
  role: 'auth_role',
  displayName: 'auth_display_name',
  avatarUrl: 'auth_avatar_url',
} as const;

const clearLegacyAuthStorage = (): void => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('displayName');
  } catch (e) {
    // Ignore storage cleanup errors in restricted browser contexts.
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const hydrateAuth = async () => {
      clearLegacyAuthStorage();
      const sessionToken = sessionStorage.getItem(AUTH_SESSION_KEYS.token);

      try {
        const baseUrl = getConfig().API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/account`, {
          method: 'GET',
          credentials: 'include',
          headers: sessionToken
            ? {
              Authorization: `Bearer ${sessionToken}`,
            }
            : undefined,
        });

        if (!response.ok) {
          setIsAuthenticated(false);
          setRole(null);
          setDisplayName(null);
          setAvatarUrl(null);
          setToken(null);
          setIsAuthLoading(false);
          return;
        }

        const payload = await response.json();
        if (payload?.EC === 0 && payload?.DT?.access_token) {
          const nextToken = payload?.DT?.access_token || sessionToken;
          const nextRole = payload?.DT?.groupWithRoles?.name || 'User';
          const nextDisplayName = payload?.DT?.username || null;
          const nextAvatarUrl = payload?.DT?.avatarUrl || null;

          setIsAuthenticated(true);
          setRole(nextRole);
          setDisplayName(nextDisplayName);
          setAvatarUrl(nextAvatarUrl);
          setToken(nextToken);
          if (nextToken) {
            sessionStorage.setItem(AUTH_SESSION_KEYS.token, nextToken);
          }
          sessionStorage.setItem(AUTH_SESSION_KEYS.role, nextRole);
          if (nextDisplayName) {
            sessionStorage.setItem(AUTH_SESSION_KEYS.displayName, nextDisplayName);
          } else {
            sessionStorage.removeItem(AUTH_SESSION_KEYS.displayName);
          }
          if (nextAvatarUrl) {
            sessionStorage.setItem(AUTH_SESSION_KEYS.avatarUrl, nextAvatarUrl);
          } else {
            sessionStorage.removeItem(AUTH_SESSION_KEYS.avatarUrl);
          }
          setIsAuthLoading(false);
          return;
        }

        sessionStorage.removeItem(AUTH_SESSION_KEYS.token);
        sessionStorage.removeItem(AUTH_SESSION_KEYS.role);
        sessionStorage.removeItem(AUTH_SESSION_KEYS.displayName);
        sessionStorage.removeItem(AUTH_SESSION_KEYS.avatarUrl);
        setIsAuthenticated(false);
        setRole(null);
        setDisplayName(null);
        setAvatarUrl(null);
        setToken(null);
        setIsAuthLoading(false);
      } catch (e) {
        sessionStorage.removeItem(AUTH_SESSION_KEYS.token);
        sessionStorage.removeItem(AUTH_SESSION_KEYS.role);
        sessionStorage.removeItem(AUTH_SESSION_KEYS.displayName);
        sessionStorage.removeItem(AUTH_SESSION_KEYS.avatarUrl);
        setIsAuthenticated(false);
        setRole(null);
        setDisplayName(null);
        setAvatarUrl(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    };

    hydrateAuth();
  }, []);

  const setAuth = (token: string, role: string, nextDisplayName?: string, nextAvatarUrl?: string | null): void => {
    clearLegacyAuthStorage();
    sessionStorage.setItem(AUTH_SESSION_KEYS.token, token);
    sessionStorage.setItem(AUTH_SESSION_KEYS.role, role);
    if (nextDisplayName) {
      sessionStorage.setItem(AUTH_SESSION_KEYS.displayName, nextDisplayName);
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEYS.displayName);
    }
    if (nextAvatarUrl) {
      sessionStorage.setItem(AUTH_SESSION_KEYS.avatarUrl, nextAvatarUrl);
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEYS.avatarUrl);
    }
    setIsAuthLoading(false);
    setIsAuthenticated(true);
    setToken(token);
    setRole(role);
    setDisplayName(nextDisplayName || null);
    setAvatarUrl(nextAvatarUrl || null);
  };

  const logout = (): void => {
    const baseUrl = getConfig().API_BASE_URL;
    fetch(`${baseUrl}/api/user/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    clearLegacyAuthStorage();
    sessionStorage.removeItem(AUTH_SESSION_KEYS.token);
    sessionStorage.removeItem(AUTH_SESSION_KEYS.role);
    sessionStorage.removeItem(AUTH_SESSION_KEYS.displayName);
    sessionStorage.removeItem(AUTH_SESSION_KEYS.avatarUrl);
    setIsAuthLoading(false);
    setIsAuthenticated(false);
    setToken(null);
    setRole(null);
    setDisplayName(null);
    setAvatarUrl(null);
  };

  const getToken = (): string | null => token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, role, displayName, avatarUrl, setAuth, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
