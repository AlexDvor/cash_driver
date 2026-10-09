import React, { createContext, useContext } from 'react';
import {
  Language,
  locales,
  translate,
  TranslationKey,
  TranslationParams,
} from '../../i18n/translations';
import { usePersistence } from '../PersistenceProvider/PersistenceProvider';
interface LanguageContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
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
        t: (key, params) => translate(language, key, params),
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
