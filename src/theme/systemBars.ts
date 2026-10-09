import { NativeModules, Platform } from 'react-native';
import { EffectiveTheme } from './resolveTheme';

export function updateSystemBars(
  appearance: EffectiveTheme,
  background: string,
) {
  if (Platform.OS !== 'android') {
    return;
  }
  const adapter:
    | {
        setAppearance: (dark: boolean, color: string) => void;
      }
    | undefined = NativeModules.CashDriverSystemBars;
  adapter?.setAppearance(appearance === 'dark', background);
}
