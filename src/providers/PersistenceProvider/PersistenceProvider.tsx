import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { initializePersistence, Persistence } from '../../app/persistence';
import { Preferences } from '../../features/settings/preferencesRepository';
import { translate, TranslationKey } from '../../i18n/translations';
import { palettes } from '../../constants/theme/tokens';
import { styles } from './PersistenceProvider.styles';

interface PersistenceContextValue {
  services: Persistence;
  preferences: Preferences;
  saving: boolean;
  errorKey: TranslationKey | null;
  updatePreferences: (patch: Partial<Preferences>) => Promise<boolean>;
  retryPreferences: () => Promise<boolean>;
}
const PersistenceContext = createContext<PersistenceContextValue | undefined>(
  undefined,
);

export function PersistenceProvider({
  children,
  initialize = initializePersistence,
}: React.PropsWithChildren<{ initialize?: () => Promise<Persistence> }>) {
  const [ready, setReady] = useState<{
    services: Persistence;
    preferences: Preferences;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const mounted = useRef(false);
  const savingRef = useRef(false);
  const failedPatch = useRef<Partial<Preferences> | null>(null);
  const bootstrapColors =
    palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    setFailed(false);
    initialize()
      .then(async services => {
        const preferences = await services.preferences.read();
        if (!cancelled) {
          setReady({ services, preferences });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [attempt, initialize]);

  const updatePreferences = useCallback(
    async (patch: Partial<Preferences>): Promise<boolean> => {
      if (!ready || savingRef.current) {
        return false;
      }
      setSaving(true);
      savingRef.current = true;
      setErrorKey(null);
      failedPatch.current = null;
      try {
        const preferences = await ready.services.preferences.update(patch);
        if (mounted.current) {
          setReady(previous => previous && { ...previous, preferences });
        }
        return true;
      } catch {
        failedPatch.current = { ...patch };
        if (mounted.current) {
          setErrorKey(
            patch.themeMode !== undefined
              ? 'themeWriteFailed'
              : 'preferencesWriteFailed',
          );
        }
        return false;
      } finally {
        savingRef.current = false;
        if (mounted.current) {
          setSaving(false);
        }
      }
    },
    [ready],
  );

  if (!ready) {
    // Do not render main screens with guessed settings before their read succeeds.
    // Spanish is the documented initial language; no corrupt-read fallback DB.
    return (
      <View
        style={[
          styles.bootstrap,
          { backgroundColor: bootstrapColors.background },
        ]}
      >
        {failed ? (
          <>
            <Text
              style={[styles.message, { color: bootstrapColors.errorText }]}
              accessibilityRole="alert"
            >
              {translate('es', 'storageFailed')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translate('es', 'retry')}
              onPress={() => setAttempt(value => value + 1)}
              style={styles.retry}
            >
              <Text
                style={[styles.message, { color: bootstrapColors.primary }]}
              >
                {translate('es', 'retry')}
              </Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator
            color={bootstrapColors.primary}
            accessibilityLabel={translate('es', 'storageLoading')}
          />
        )}
      </View>
    );
  }
  return (
    <PersistenceContext.Provider
      value={{
        ...ready,
        saving,
        errorKey,
        updatePreferences,
        retryPreferences: () =>
          failedPatch.current
            ? updatePreferences(failedPatch.current)
            : Promise.resolve(false),
      }}
    >
      {children}
    </PersistenceContext.Provider>
  );
}

export function usePersistence(): PersistenceContextValue {
  const context = useContext(PersistenceContext);
  if (!context) {
    throw new Error('usePersistence must be used inside PersistenceProvider');
  }
  return context;
}
