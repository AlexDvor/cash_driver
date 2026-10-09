import { Platform } from 'react-native';

export function confirmationHaptics(enabled: boolean): void {
  if (!enabled || (Platform.OS !== 'android' && Platform.OS !== 'ios')) {
    return;
  }
  try {
    // Lazy loading also tolerates an unavailable native module on old installs.
    const feedback: typeof import('react-native-haptic-feedback') = require('react-native-haptic-feedback');
    if (!feedback.isSupported()) {
      return;
    }
    let type: 'notificationSuccess' | 'confirm' | 'virtualKey' =
      'notificationSuccess';
    if (Platform.OS === 'android') {
      type = Number(Platform.Version) >= 30 ? 'confirm' : 'virtualKey';
    }
    feedback.trigger(type, {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    });
  } catch {
    // Optional feedback must never turn an already committed payment into failure.
  }
}
