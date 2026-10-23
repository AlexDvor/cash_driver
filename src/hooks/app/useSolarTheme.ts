import { solarThemeTiming } from '../../constants/solarTheme';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  hasSolarLocationPermission,
  requestSolarLocationPermission,
  watchSolarLocation,
  type SolarLocationFix,
} from '../../features/settings/solarLocation';
import {
  calculateSolarTheme,
  validSolarCoordinates,
} from '../../theme/solarTheme';
import type { ThemeMode } from '../../theme/resolveTheme';

export type AutomaticThemeStatus = 'idle' | 'locating' | 'solar' | 'fallback';

export function useSolarTheme(mode: ThemeMode) {
  const [fix, setFix] = useState<SolarLocationFix | null>(null);
  const [status, setStatus] = useState<AutomaticThemeStatus>('fallback');
  const [now, setNow] = useState(Date.now);
  const [refresh, setRefresh] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const mounted = useRef(false);
  const requesting = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const requestAccess = useCallback(async () => {
    if (
      !mounted.current ||
      requesting.current ||
      modeRef.current !== 'system' ||
      AppState.currentState !== 'active'
    )
      return;
    requesting.current = true;
    try {
      await requestSolarLocationPermission();
      if (mounted.current && modeRef.current === 'system')
        setRefresh(value => value + 1);
    } finally {
      requesting.current = false;
    }
  }, []);

  useEffect(() => {
    if (mode !== 'system') {
      setFix(null);
      setStatus('idle');
      return;
    }
    let alive = true;
    let generation = 0;
    let stop = () => {};
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
      generation++;
      stop();
      stop = () => {};
      clearTimeout(timeout);
      timeout = undefined;
    };
    const start = () => {
      cancel();
      setFix(null);
      if (AppState.currentState !== 'active') {
        setStatus('fallback');
        return;
      }
      const token = generation;
      const current = () =>
        alive && token === generation && AppState.currentState === 'active';
      const unavailable = () => {
        if (!current()) return;
        cancel();
        setFix(null);
        setStatus('fallback');
      };
      setStatus('locating');
      hasSolarLocationPermission().then(granted => {
        if (!current()) return;
        if (!granted) {
          unavailable();
          return;
        }
        timeout = setTimeout(unavailable, solarThemeTiming.fixTimeoutMs);
        try {
          const release = watchSolarLocation(
            value => {
              if (!current()) return;
              const age = Date.now() - value.timestamp;
              if (
                !validSolarCoordinates(value) ||
                !Number.isFinite(value.timestamp) ||
                age < 0 ||
                age > solarThemeTiming.maxInitialFixAgeMs
              ) {
                // Providers may emit a cached fix before a fresh one. Ignore it
                // and keep waiting within the existing acquisition timeout.
                return;
              }
              clearTimeout(timeout);
              timeout = undefined;
              setNow(Date.now());
              setFix(value);
              setStatus('solar');
            },
            permissionDenied => {
              if (!current()) return;
              if (permissionDenied) {
                unavailable();
                return;
              }
              // Temporary provider outages may recover without another tap.
              setFix(null);
              setStatus('fallback');
              if (!timeout)
                timeout = setTimeout(
                  unavailable,
                  solarThemeTiming.fixTimeoutMs,
                );
            },
          );
          if (current()) stop = release;
          else release();
        } catch {
          unavailable();
        }
      }, unavailable);
    };
    start();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') start();
      else {
        cancel();
        setFix(null);
        setStatus('fallback');
      }
    });
    return () => {
      alive = false;
      cancel();
      subscription.remove();
    };
  }, [mode, refresh]);

  const solar = useMemo(
    () => (mode === 'system' && fix ? calculateSolarTheme(now, fix) : null),
    [mode, fix, now],
  );
  useEffect(() => {
    if (mode !== 'system' || !fix) return;
    // Exact next solar boundary, with a bounded recheck for wall-clock changes.
    const delay = solar?.nextChangeAt
      ? Math.min(
          solarThemeTiming.clockCheckIntervalMs,
          Math.max(1, solar.nextChangeAt - Date.now()),
        )
      : solarThemeTiming.clockCheckIntervalMs;
    const timer = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [mode, fix, now, solar]);
  return {
    appearance: solar?.appearance,
    status: status === 'solar' && !solar ? ('fallback' as const) : status,
    requestAccess,
  };
}
