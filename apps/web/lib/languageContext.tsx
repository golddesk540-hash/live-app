'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  setLang: (lang: Language) => void;
  isUr: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  toggleLang: () => {},
  setLang: () => {},
  isUr: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    // Check saved preference in localStorage
    const saved = localStorage.getItem('popo_live_lang') as Language;
    if (saved === 'en' || saved === 'ur') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('popo_live_lang', newLang);
    // Update html attributes for global accessibility
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ur' : 'en');
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        toggleLang,
        setLang,
        isUr: lang === 'ur',
      }}
    >
      <div
        dir={lang === 'ur' ? 'rtl' : 'ltr'}
        className={lang === 'ur' ? 'font-urdu' : 'font-sans'}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
