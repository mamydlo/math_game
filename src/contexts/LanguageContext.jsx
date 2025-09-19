import React, { createContext, useContext, useState, useEffect } from 'react';

// Import translation files
import enTranslations from '../locales/en.json';
import deTranslations from '../locales/de.json';
import skTranslations from '../locales/sk.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
  sk: skTranslations,
};

const LanguageContext = createContext();

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Get saved language from localStorage or default to English
    return localStorage.getItem('mathgame_language') || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('mathgame_language', currentLanguage);
  }, [currentLanguage]);

  const t = (key, interpolations = {}) => {
    // Get translation for current language, fallback to English if not found
    const currentTranslations = translations[currentLanguage] || translations.en;
    let translation = currentTranslations[key] || translations.en[key] || key;
    
    // Handle interpolations (replace {{variable}} with actual values)
    Object.keys(interpolations).forEach(variable => {
      translation = translation.replace(new RegExp(`{{${variable}}}`, 'g'), interpolations[variable]);
    });
    
    return translation;
  };

  const changeLanguage = (languageCode) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode);
    }
  };

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  ];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
