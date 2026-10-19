import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

export function useCalendarMotion() {
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const preference = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        changed = true;
        setReduced(value);
      },
    );
    const state = AppState.addEventListener('change', value =>
      setActive(value === 'active'),
    );
    AccessibilityInfo.isReduceMotionEnabled().then(
      value => {
        if (mounted && !changed) setReduced(value);
      },
      () => {},
    );
    return () => {
      mounted = false;
      preference.remove();
      state.remove();
    };
  }, []);
  return { reduced, active };
}
