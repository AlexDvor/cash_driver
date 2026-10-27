import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Default to no motion until the device preference has been resolved.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        changed = true;
        setReduced(value);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled().then(
      value => {
        if (mounted && !changed) setReduced(value);
      },
      () => {},
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
