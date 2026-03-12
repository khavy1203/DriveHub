import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Định nghĩa types
interface AuthContextType {
  isAuthenticated: boolean;
  role: string | null; 
  setAuth: (token: string, role: string) => void;
  logout: () => void;
  getToken: () => string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cung cấp AuthContext
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);

  // Legacy context: do not hydrate from localStorage.
  useEffect(() => {
    setIsAuthenticated(false);
    setRole(null);
  }, []);

  // Keep in-memory only.
  const setAuth = (token: string, role: string) => {
    void token;
    setIsAuthenticated(true);
    setRole(role);
  };

  // Clear in-memory authentication state.
  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
  };

  // Token is not persisted in this legacy context.
  const getToken = () => null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, setAuth, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
