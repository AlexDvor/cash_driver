import React, { createContext, useContext, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { palettes, Palette } from './tokens';
import { EffectiveTheme, resolveTheme, ThemeMode } from './resolveTheme';
interface ThemeContextValue {
  mode: ThemeMode;
  appearance: EffectiveTheme;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
export function ThemeProvider({ children }: React.PropsWithChildren) {
  // Session-only foundation. SQLite preference restoration belongs to Phase 3.
  const [mode, setMode] = useState<ThemeMode>('system');
  const appearance = resolveTheme(mode, useColorScheme());
  const colors = palettes[appearance];
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
