import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME_MAP = {
  ROLE_ADMIN: '/management',
  ROLE_GENERATOR: '/generator',
  ROLE_TECHNICIAN: '/technician',
  ROLE_COLLECTOR: '/collector',
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = ROLE_HOME_MAP[user.role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
