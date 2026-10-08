import React, { createContext, useContext, useState } from 'react';
import { Language, locales, translate, TranslationKey } from './translations';
interface LanguageContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}
const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);
export function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useState<Language>('es');
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        locale: locales[language],
        t: key => translate(language, key),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
export function useTranslation(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error('useTranslation must be used inside LanguageProvider');
  }
  return value;
}
