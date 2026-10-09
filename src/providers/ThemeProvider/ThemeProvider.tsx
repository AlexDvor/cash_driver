import React, { createContext, useContext, useEffect } from 'react';
import { AppState, StatusBar, useColorScheme } from 'react-native';
import { palettes, Palette } from '../../constants/theme/tokens';
import {
  EffectiveTheme,
  resolveTheme,
  ThemeMode,
} from '../../theme/resolveTheme';
import { usePersistence } from '../PersistenceProvider/PersistenceProvider';
import { updateSystemBars } from '../../theme/systemBars';
interface ThemeContextValue {
  mode: ThemeMode;
  appearance: EffectiveTheme;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
export function ThemeProvider({ children }: React.PropsWithChildren) {
  const { preferences, updatePreferences } = usePersistence();
  const mode = preferences.themeMode;
  const setMode = (nextMode: ThemeMode) => {
    updatePreferences({ themeMode: nextMode });
  };
  const appearance = resolveTheme(mode, useColorScheme());
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
    <ThemeContext.Provider value={{ mode, setMode, appearance, colors }}>
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
