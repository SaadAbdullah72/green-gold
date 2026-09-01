import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginGate from './components/LoginGate';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import ManagementDashboard from './components/ManagementDashboard';
import UserDashboard from './components/UserDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import CollectorDashboard from './components/CollectorDashboard';
import TransporterDashboard from './components/TransporterDashboard';
import RecyclingPlantDashboard from './components/RecyclingPlantDashboard';
import DumpingFacilityDashboard from './components/DumpingFacilityDashboard';

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
    case 'ROLE_TRANSPORTER':
      return '/transporter';
    case 'ROLE_RECYCLING_PLANT':
      return '/recycling-plant';
    case 'ROLE_DUMP_FACILITY':
      return '/dump-facility';
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
      {/* Landing page for unauthenticated visitors; redirect logged-in users to their home */}
      <Route path="/" element={user ? <Navigate to={getHomeRoute(user.role)} replace /> : <LandingPage />} />

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

      <Route
        path="/transporter"
        element={
          <ProtectedRoute allowedRoles={['ROLE_TRANSPORTER', 'ROLE_ADMIN']}>
            <TransporterDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recycling-plant"
        element={
          <ProtectedRoute allowedRoles={['ROLE_RECYCLING_PLANT', 'ROLE_ADMIN']}>
            <RecyclingPlantDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dump-facility"
        element={
          <ProtectedRoute allowedRoles={['ROLE_DUMP_FACILITY', 'ROLE_ADMIN']}>
            <DumpingFacilityDashboard onLogout={handleLogout} />
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
