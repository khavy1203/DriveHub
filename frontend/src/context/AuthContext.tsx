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

  // Initialize authentication state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (token && storedRole) {
      setIsAuthenticated(true);
      setRole(storedRole);
    }
  }, []);

  // Set authentication state and save token/role in localStorage
  const setAuth = (token: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setRole(role);
  };

  // Clear authentication state and remove token/role from localStorage
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setRole(null);
  };

  // Retrieve the token (useful for API calls)
  const getToken = () => localStorage.getItem('token');

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
