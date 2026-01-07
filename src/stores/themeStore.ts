/**
 * Theme Store - Manages dark/light mode preference
 */

import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Get initial theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('koine-theme');
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }

  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
};

// Apply theme to document
const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('koine-theme', theme);
  }
};

// Initialize theme on load
if (typeof document !== 'undefined') {
  applyTheme(getInitialTheme());
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme: Theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    set({ theme: newTheme });
  },
}));
