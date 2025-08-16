import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  themeSource: 'system' | 'manual';
  setSystemTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeSource, setThemeSource] = useState<'system' | 'manual'>(() => {
    const saved = localStorage.getItem('themeSource');
    return (saved as 'system' | 'manual') || 'system';
  });

  const [isDark, setIsDark] = useState(() => {
    const savedSource = localStorage.getItem('themeSource');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedSource === 'manual' && savedTheme) {
      return savedTheme === 'dark';
    }
    
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen for system theme changes
  useEffect(() => {
    if (themeSource === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      
      // Set initial value based on current system preference
      setIsDark(mediaQuery.matches);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [themeSource]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Only save theme preference if manually set
    if (themeSource === 'manual') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } else {
      localStorage.removeItem('theme');
    }
    
    localStorage.setItem('themeSource', themeSource);
  }, [isDark, themeSource]);

  const toggleTheme = () => {
    setThemeSource('manual');
    setIsDark(!isDark);
  };

  const setSystemTheme = () => {
    setThemeSource('system');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(systemPreference);
  };

  const value: ThemeContextType = {
    isDark,
    toggleTheme,
    themeSource,
    setSystemTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};