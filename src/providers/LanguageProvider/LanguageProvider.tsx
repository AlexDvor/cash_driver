import React, { createContext, useCallback, useContext, useMemo } from 'react';
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
  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      updatePreferences({ language: nextLanguage });
    },
    [updatePreferences],
  );
  // Memoized: every text in the app reads this context, so it must change only
  // when the language does (not on unrelated preference writes).
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      locale: locales[language],
      t: (key: TranslationKey, params?: TranslationParams) =>
        translate(language, key, params),
    }),
    [language, setLanguage],
  );
  return (
    <LanguageContext.Provider value={value}>
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
