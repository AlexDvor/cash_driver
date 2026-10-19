// Persisted 'system' is the compatible Automatic identifier. ThemeProvider
// resolves its solar appearance first; this helper supplies the device fallback.
export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';
export function resolveTheme(
  mode: ThemeMode,
  systemAppearance: EffectiveTheme | null | undefined,
): EffectiveTheme {
  if (mode !== 'system') {
    return mode;
  }
  return systemAppearance === 'dark' ? 'dark' : 'light';
}
