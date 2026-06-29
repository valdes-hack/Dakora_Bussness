/**
 * ThemeContext — Source unique de vérité pour le mode clair/sombre.
 * Applique la classe 'dark' sur <html> de façon synchrone dès l'init
 * pour éviter le flash de thème au chargement.
 */
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

// ── Application SYNCHRONE au chargement (avant le premier rendu React) ──
// On lit localStorage ici, hors du composant, pour agir immédiatement.
const initDark = localStorage.getItem('theme') === 'dark';
if (initDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(initDark);

  // Synchronise la classe dark à chaque changement de state
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
