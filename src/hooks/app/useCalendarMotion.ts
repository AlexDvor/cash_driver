import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

export function useCalendarMotion() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const state = AppState.addEventListener('change', value =>
      setActive(value === 'active'),
    );
    return () => {
      state.remove();
    };
  }, []);
  return { reduced, active };
}
