
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { THEMES } from '../data/initialData';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentThemeKey, setCurrentThemeKey] = useLocalStorage('theme-preference', 'tilo');
  
    const [showParticles, setShowParticles] = useLocalStorage('theme-particles', true); // Default On

  // Validate theme key exists, fallback to 'tilo' if not
  const activeTheme = THEMES[currentThemeKey] ? THEMES[currentThemeKey] : THEMES['tilo'];

  useEffect(() => {
    // Optionally update body class or meta tags if needed, 
    // but we are using Javascript-driven classes as per brief
  }, [currentThemeKey]);

  return (
    <ThemeContext.Provider value={{
      theme: activeTheme,
      currentThemeKey,
      setTheme: setCurrentThemeKey,
      showParticles,
      toggleParticles: () => setShowParticles(!showParticles),
      availableThemes: THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
