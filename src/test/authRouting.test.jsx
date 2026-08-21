import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

function ProtectedContent() {
  return <div>Protected Content</div>;
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/management']}>
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});
