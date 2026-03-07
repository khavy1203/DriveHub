import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: JSX.Element;
    roles?: string[];  // Danh sách các role được phép truy cập
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    console.log('roles', roles)

    console.log('check role user', role)

    if (roles && !roles.includes(role || "")) {
        console.log('đã đúng role rồi')
        return <Navigate to="/students" replace />;
    }

    return children;
};

export default ProtectedRoute;
