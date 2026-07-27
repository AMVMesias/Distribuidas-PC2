'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/shared/theme/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="grid size-10 place-items-center rounded-full border transition hover:-translate-y-0.5"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
