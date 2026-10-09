import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function readClock() {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return { now, timeZone, dayKey };
}

export function useLocalClock() {
  const [clock, setClock] = useState(readClock);
  useEffect(() => {
    const update = () => setClock(readClock());
    const interval = setInterval(update, 1000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        update();
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
  return clock;
}
