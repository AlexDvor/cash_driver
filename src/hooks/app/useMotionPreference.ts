import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export type MotionPreference = 'pending' | 'full' | 'reduced';

// Like useReducedMotion, but distinguishes "not resolved yet" so decorative
// animations can start from their initial state instead of flashing the final one.
export function useMotionPreference(): MotionPreference {
  const [preference, setPreference] = useState<MotionPreference>('pending');
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        changed = true;
        setPreference(value ? 'reduced' : 'full');
      },
    );
    AccessibilityInfo.isReduceMotionEnabled().then(
      value => {
        if (mounted && !changed) setPreference(value ? 'reduced' : 'full');
      },
      () => {
        if (mounted && !changed) setPreference('reduced');
      },
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return preference;
}
