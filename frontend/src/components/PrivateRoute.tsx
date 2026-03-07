import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // Optional role for access control
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login if the user is not authenticated
    return <Navigate to="/login" />;
  }
  if (requiredRole && role != requiredRole) {
    // Redirect if the user does not have the required role
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
