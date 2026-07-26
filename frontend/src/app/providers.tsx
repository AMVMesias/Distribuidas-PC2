'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { AuthProvider, useAuth } from '@/features/auth/model/AuthContext';

function BackGuard() {
  const { session, loading } = useAuth();

  useEffect(() => {
    const onPopState = () => {
      if (loading || session) return;
      const currentPath = window.location.pathname;
      const currentLocale = currentPath.split('/')[1] || 'es';
      if (currentPath.startsWith(`/${currentLocale}/portal`)) {
        window.location.replace(`/${currentLocale}`);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [loading, session]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BackGuard />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
