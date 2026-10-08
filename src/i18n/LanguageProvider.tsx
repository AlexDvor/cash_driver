import React, { createContext, useContext } from 'react';
import {
  Language,
  locales,
  translate,
  TranslationKey,
} from './translations';
import { usePersistence } from '../app/PersistenceProvider';
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
  const { preferences, updatePreferences } = usePersistence();
  const language = preferences.language;
  const setLanguage = (nextLanguage: Language) => {
    updatePreferences({ language: nextLanguage });
  };
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
