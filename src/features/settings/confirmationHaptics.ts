import { Platform } from 'react-native';
import { paymentTiming } from '../../constants/timing';

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
    const options = {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    };
    if (Platform.OS === 'android') {
      // Short OEM view effects were imperceptible on the owner's Samsung.
      feedback.triggerPattern(
        [
          {
            time: 0,
            type: 'continuous',
            duration: paymentTiming.confirmationVibrationDurationMs,
            intensity: 1,
          },
        ],
        options,
      );
    } else {
      feedback.trigger('notificationSuccess', options);
    }
  } catch {
    // Optional feedback must never turn an already committed payment into failure.
  }
}
