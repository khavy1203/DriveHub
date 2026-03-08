/**
 * Authentication context and hook
 * @module features/auth/hooks/useAuth
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (token && storedRole) {
      setIsAuthenticated(true);
      setRole(storedRole);
    }
  }, []);

  const setAuth = (token: string, role: string): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setRole(role);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setRole(null);
  };

  const getToken = (): string | null => localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, setAuth, logout, getToken }}>
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
