import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  updatePreferences: (patch: Partial<Preferences>) => Promise<boolean>;
  retryPreferences: () => Promise<boolean>;
}
// Saving state changes twice on every preference write. Keeping it in its own
// context means only the screens that show it re-render, not the whole app.
interface PersistenceStatusValue {
  saving: boolean;
  errorKey: TranslationKey | null;
}
const PersistenceContext = createContext<PersistenceContextValue | undefined>(
  undefined,
);
// Most hooks only need the services, which never change after startup. Their
// own context keeps them from re-rendering when preferences are written.
const PersistenceServicesContext = createContext<
  { services: Persistence } | undefined
>(undefined);
const PersistenceStatusContext = createContext<
  PersistenceStatusValue | undefined
>(undefined);

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
  const readyRef = useRef(ready);
  readyRef.current = ready;
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
      const current = readyRef.current;
      if (!current || savingRef.current) {
        return false;
      }
      setSaving(true);
      savingRef.current = true;
      setErrorKey(null);
      failedPatch.current = null;
      try {
        const preferences = await current.services.preferences.update(patch);
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
    // Stable on purpose: the latest `ready` is read through the ref, so a
    // preference write never changes this function's identity.
    [],
  );
  const retryPreferences = useCallback(
    () =>
      failedPatch.current
        ? updatePreferences(failedPatch.current)
        : Promise.resolve(false),
    [updatePreferences],
  );
  const value = useMemo(
    () =>
      ready && {
        services: ready.services,
        preferences: ready.preferences,
        updatePreferences,
        retryPreferences,
      },
    [ready, updatePreferences, retryPreferences],
  );
  const servicesValue = useMemo(
    () => (ready ? { services: ready.services } : undefined),
    [ready?.services], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const status = useMemo(() => ({ saving, errorKey }), [saving, errorKey]);

  if (!ready || !value) {
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
              onPress={() => setAttempt(previous => previous + 1)}
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
    <PersistenceServicesContext.Provider value={servicesValue}>
      <PersistenceContext.Provider value={value}>
        <PersistenceStatusContext.Provider value={status}>
          {children}
        </PersistenceStatusContext.Provider>
      </PersistenceContext.Provider>
    </PersistenceServicesContext.Provider>
  );
}

export function usePersistence(): PersistenceContextValue {
  const context = useContext(PersistenceContext);
  if (!context) {
    throw new Error('usePersistence must be used inside PersistenceProvider');
  }
  return context;
}

export function usePersistenceStatus(): PersistenceStatusValue {
  const context = useContext(PersistenceStatusContext);
  if (!context) {
    throw new Error(
      'usePersistenceStatus must be used inside PersistenceProvider',
    );
  }
  return context;
}

export function usePersistenceServices(): { services: Persistence } {
  const context = useContext(PersistenceServicesContext);
  if (!context) {
    throw new Error(
      'usePersistenceServices must be used inside PersistenceProvider',
    );
  }
  return context;
}
