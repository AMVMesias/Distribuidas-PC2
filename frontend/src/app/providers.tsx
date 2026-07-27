'use client';

import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { AuthProvider } from '@/features/auth/model/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
