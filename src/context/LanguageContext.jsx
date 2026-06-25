import React, { createContext, useState, useContext, useEffect } from 'react';
import fr from '../i18n/locales/fr.json';
import en from '../i18n/locales/en.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // On regarde s'il y a déjà une langue enregistrée, sinon on met 'fr'
  const [language, setLanguage] = useState(localStorage.getItem('dakora_lang') || 'fr');

  const translations = { fr, en };

  // À chaque fois que la langue change, on l'enregistre dans le navigateur
  useEffect(() => {
    localStorage.setItem('dakora_lang', language);
  }, [language]);

  // Fonction magique pour récupérer une traduction
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);