import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const normalizeRole = (role) => {
  const value = String(role || '').toUpperCase();

  if (value === 'MANAGEMENT' || value === 'ROLE_ADMIN' || value === 'ADMIN') return 'ROLE_ADMIN';
  if (value === 'USER' || value === 'ROLE_GENERATOR' || value === 'GENERATOR') return 'ROLE_GENERATOR';
  if (value === 'TECHNICAL' || value === 'ROLE_TECHNICIAN' || value === 'TECHNICIAN') return 'ROLE_TECHNICIAN';
  if (value === 'COLLECTOR' || value === 'ROLE_COLLECTOR') return 'ROLE_COLLECTOR';
  if (value === 'TRANSPORTER' || value === 'ROLE_TRANSPORTER') return 'ROLE_TRANSPORTER';
  if (value === 'RECYCLING_PLANT' || value === 'ROLE_RECYCLING_PLANT') return 'ROLE_RECYCLING_PLANT';
  if (value === 'DUMP_FACILITY' || value === 'ROLE_DUMP_FACILITY' || value === 'DUMP_YARD') return 'ROLE_DUMP_FACILITY';

  return 'ROLE_GENERATOR';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('greengold_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return { ...parsed, role: normalizeRole(parsed.role) };
    } catch (error) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('greengold_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const storedUser = localStorage.getItem('greengold_user');
        const storedToken = localStorage.getItem('greengold_token');

        if (storedUser && storedToken) {
          const parsed = JSON.parse(storedUser);
          setUser({ ...parsed, role: normalizeRole(parsed.role) });
          setToken(storedToken);
        }
      } catch (error) {
        console.warn('Auth restore failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restore();
  }, []);

  const login = useCallback((userPayload, authToken = null) => {
    const normalizedUser = { ...userPayload, role: normalizeRole(userPayload?.role) };
    setUser(normalizedUser);
    setToken(authToken || localStorage.getItem('greengold_token') || null);
    localStorage.setItem('greengold_user', JSON.stringify(normalizedUser));
    if (authToken) localStorage.setItem('greengold_token', authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('greengold_user');
    localStorage.removeItem('greengold_token');
  }, []);

  const restoreSession = useCallback(async () => {
    const storedUser = localStorage.getItem('greengold_user');
    const storedToken = localStorage.getItem('greengold_token');

    if (!storedUser || !storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser({ ...parsed, role: normalizeRole(parsed.role) });
      setToken(storedToken);
      return parsed;
    } catch (error) {
      logout();
      return null;
    }
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
      restoreSession,
      setUser,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
