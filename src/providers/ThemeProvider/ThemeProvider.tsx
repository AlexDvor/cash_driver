import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, StatusBar, useColorScheme } from 'react-native';
import { palettes, Palette } from '../../constants/theme/tokens';
import {
  EffectiveTheme,
  resolveTheme,
  ThemeMode,
} from '../../theme/resolveTheme';
import { usePersistence } from '../PersistenceProvider/PersistenceProvider';
import { updateSystemBars } from '../../theme/systemBars';
import {
  useSolarTheme,
  type AutomaticThemeStatus,
} from '../../hooks/app/useSolarTheme';
interface ThemeContextValue {
  mode: ThemeMode;
  appearance: EffectiveTheme;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
  automaticThemeStatus: AutomaticThemeStatus;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
export function ThemeProvider({ children }: React.PropsWithChildren) {
  const { preferences, updatePreferences } = usePersistence();
  const mode = preferences.themeMode;
  const {
    appearance: solarAppearance,
    status: automaticThemeStatus,
    requestAccess,
  } = useSolarTheme(mode);
  const [accessRequest, setAccessRequest] = useState(0);
  const handledAccessRequest = useRef(0);
  const setMode = async (nextMode: ThemeMode) => {
    const saved = await updatePreferences({ themeMode: nextMode });
    if (saved && nextMode === 'system') setAccessRequest(value => value + 1);
  };
  useEffect(() => {
    if (accessRequest === handledAccessRequest.current) return;
    handledAccessRequest.current = accessRequest;
    if (mode === 'system') requestAccess();
  }, [accessRequest, mode, requestAccess]);
  const systemAppearance = useColorScheme();
  const appearance =
    mode === 'system' && solarAppearance
      ? solarAppearance
      : resolveTheme(mode, systemAppearance);
  const colors = palettes[appearance];
  useEffect(() => {
    const apply = () => updateSystemBars(appearance, colors.card);
    apply();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        apply();
      }
    });
    return () => subscription.remove();
  }, [appearance, colors.card]);
  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        appearance,
        colors,
        automaticThemeStatus,
      }}
    >
      <StatusBar
        barStyle={appearance === 'dark' ? 'light-content' : 'dark-content'}
      />
      {children}
    </ThemeContext.Provider>
  );
}
export function useAppTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return theme;
}
