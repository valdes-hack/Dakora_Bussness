/**
 * ThemeContext — Source unique de vérité pour le mode clair/sombre.
 * Header (client) et AdminNavbar lisent et modifient ce même contexte.
 * Le thème est persisté dans localStorage('theme').
 */
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Initialisation depuis localStorage au premier rendu
    return localStorage.getItem('theme') === 'dark';
  });

  // Applique la classe 'dark' sur <html> à chaque changement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
