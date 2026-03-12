/**
 * Authentication context and hook
 * @module features/auth/hooks/useAuth
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AuthContextType } from '../types/auth.types';
import { getConfig } from '../../../core/config/environment';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const hydrateAuth = async () => {
      clearLegacyAuthStorage();

      try {
        const baseUrl = getConfig().API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${baseUrl}/api/account`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          setIsAuthenticated(false);
          setRole(null);
          setDisplayName(null);
          setToken(null);
          setIsAuthLoading(false);
          return;
        }

        const payload = await response.json();
        if (payload?.EC === 0 && payload?.DT?.access_token) {
          setIsAuthenticated(true);
          setRole(payload?.DT?.groupWithRoles?.name || 'User');
          setDisplayName(payload?.DT?.username || null);
          setToken(payload?.DT?.access_token || null);
          setIsAuthLoading(false);
          return;
        }

        setIsAuthenticated(false);
        setRole(null);
        setDisplayName(null);
        setToken(null);
        setIsAuthLoading(false);
      } catch (e) {
        setIsAuthenticated(false);
        setRole(null);
        setDisplayName(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    };

    hydrateAuth();
  }, []);

  const setAuth = (token: string, role: string, nextDisplayName?: string): void => {
    clearLegacyAuthStorage();
    setIsAuthLoading(false);
    setIsAuthenticated(true);
    setToken(token);
    setRole(role);
    setDisplayName(nextDisplayName || null);
  };

  const logout = (): void => {
    const baseUrl = getConfig().API_BASE_URL || 'http://localhost:8080';
    fetch(`${baseUrl}/api/user/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    clearLegacyAuthStorage();
    setIsAuthLoading(false);
    setIsAuthenticated(false);
    setToken(null);
    setRole(null);
    setDisplayName(null);
  };

  const getToken = (): string | null => token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, role, displayName, setAuth, logout, getToken }}>
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
