'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
interface ThemeContextValue { theme: Theme; toggleTheme: () => void }

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('nexo-theme') as Theme | null;
      const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(saved ?? preferred);
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('nexo-theme', theme);
  }, [ready, theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
