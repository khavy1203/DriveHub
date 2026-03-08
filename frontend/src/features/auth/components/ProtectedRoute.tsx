/**
 * Protected route component with multiple roles support
 * @module features/auth/components/ProtectedRoute
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  roles,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/students" replace />;
  }

  return children;
};

export default ProtectedRoute;
