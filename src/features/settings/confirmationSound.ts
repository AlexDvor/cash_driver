import { AppState, NativeModules, Platform } from 'react-native';

export function confirmationSound(enabled: boolean): void {
  if (
    !enabled ||
    AppState.currentState !== 'active' ||
    (Platform.OS !== 'android' && Platform.OS !== 'ios')
  )
    return;
  try {
    const sound = NativeModules.CashDriverConfirmationSound as
      | { play?: () => void }
      | undefined;
    sound?.play?.();
  } catch {
    // Audio is optional; an already committed payment must remain successful.
  }
}
