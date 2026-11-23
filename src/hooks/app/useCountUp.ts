import { useEffect, useRef, useState } from 'react';

// Eases an integer from its previous value to `target`. Returns the in-flight
// value while animating and null otherwise, so callers show the real text when
// idle (and tests/accessibility always see the final amount).
export function useCountUp(
  target: number | null,
  enabled: boolean,
  duration = 650,
): number | null {
  const [shown, setShown] = useState<number | null>(null);
  const current = useRef(0);
  useEffect(() => {
    if (target === null) return;
    if (!enabled) {
      current.current = target;
      setShown(null);
      return;
    }
    const from = current.current;
    if (from === target) {
      setShown(null);
      return;
    }
    const startedAt = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      current.current = value;
      if (progress < 1) {
        setShown(value);
        frame = requestAnimationFrame(tick);
      } else {
        current.current = target;
        setShown(null);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, duration]);
  return shown;
}
