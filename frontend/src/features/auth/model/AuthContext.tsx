'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthSession, RegistrationData, User, UserRole } from '@/entities/user/model/user.types';
import { ApiError, apiRequest } from '@/shared/api/client';

interface AuthContextValue {
  session: AuthSession | null;
  user: User | null;
  loading: boolean;
  roles: UserRole[];
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const STORAGE_KEY = 'nexo-session';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setSession(JSON.parse(saved)); } catch { localStorage.removeItem(STORAGE_KEY); }
      }
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const save = useCallback((next: AuthSession | null) => {
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = async (username: string, password: string) => {
    save(await apiRequest<AuthSession>('/api/v1/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password }),
    }));
  };

  const register = async (data: RegistrationData) => {
    save(await apiRequest<AuthSession>('/api/v1/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    }));
  };

  const request = useCallback(async <T,>(path: string, options: RequestInit = {}) => {
    if (!session) throw new ApiError(401, 'Debes iniciar sesión.');
    try {
      return await apiRequest<T>(path, options, session.accessToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      const renewed = await apiRequest<AuthSession>('/api/v1/auth/refresh', {
        method: 'POST', body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      save(renewed);
      return apiRequest<T>(path, options, renewed.accessToken);
    }
  }, [save, session]);

  const logout = async () => {
    if (session) {
      try {
        await apiRequest('/api/v1/auth/logout', {
          method: 'POST', body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
      } finally { save(null); }
    }
  };

  const refreshUser = async () => {
    if (!session) return;
    const user = await apiRequest<User>('/api/v1/auth/me', {}, session.accessToken);
    save({ ...session, user });
  };

  const roles = session?.user.roles.filter(role => role.active).map(role => role.name) ?? [];
  const value = {
    session, user: session?.user ?? null, loading, roles, login, register, logout, refreshUser, request,
    hasRole: (...expected: UserRole[]) => expected.some(role => roles.includes(role)),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
