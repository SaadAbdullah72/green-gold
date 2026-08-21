import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginGate from './components/LoginGate';
import ProtectedRoute from './components/ProtectedRoute';
import ManagementDashboard from './components/ManagementDashboard';
import UserDashboard from './components/UserDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import CollectorDashboard from './components/CollectorDashboard';

function getHomeRoute(role) {
  switch (role) {
    case 'ROLE_ADMIN':
      return '/management';
    case 'ROLE_GENERATOR':
      return '/generator';
    case 'ROLE_TECHNICIAN':
      return '/technician';
    case 'ROLE_COLLECTOR':
      return '/collector';
    default:
      return '/login';
  }
}

function AppRoutes() {
  const { user, restoreSession, logout } = useAuth();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleLogout = () => {
    logout();
  };

  if (!user && !window.location.pathname.startsWith('/login')) {
    // kept intentionally light; the route guard handles the redirect
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? getHomeRoute(user.role) : '/login'} replace />} />

      <Route
        path="/login"
        element={
          user ? <Navigate to={getHomeRoute(user.role)} replace /> : <LoginGate onLogout={handleLogout} />
        }
      />

      <Route
        path="/management"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <ManagementDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/generator"
        element={
          <ProtectedRoute allowedRoles={['ROLE_GENERATOR']}>
            <UserDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={['ROLE_TECHNICIAN']}>
            <TechnicianDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/collector"
        element={
          <ProtectedRoute allowedRoles={['ROLE_COLLECTOR']}>
            <CollectorDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? getHomeRoute(user.role) : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
