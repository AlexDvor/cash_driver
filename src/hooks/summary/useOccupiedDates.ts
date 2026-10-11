import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { CalendarMonth } from '../../features/summary/periods';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';

export type OccupiedDatesState =
  | { status: 'idle' | 'loading' | 'error'; dates: null }
  | { status: 'ready'; dates: string[] };

export function useOccupiedDates(
  month: Readonly<CalendarMonth>,
  timeZone: string,
  enabled = true,
) {
  const { services } = usePersistence();
  const { year, month: monthNumber } = month;
  const key = `${year}/${monthNumber}/${timeZone}/${enabled}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const currentServices = useRef(services);
  currentServices.current = services;
  const generation = useRef(0);
  const mounted = useRef(false);
  const scheduled = useRef<{ key: string; services: typeof services } | null>(
    null,
  );
  const [result, setResult] = useState<{
    key: string;
    services: typeof services;
    state: OccupiedDatesState;
  }>({
    key,
    services,
    state: { status: enabled ? 'loading' : 'idle', dates: null },
  });
  const refresh = useCallback(async () => {
    if (
      !enabled ||
      !mounted.current ||
      key !== currentKey.current ||
      services !== currentServices.current
    ) {
      return;
    }
    const request = ++generation.current;
    setResult({ key, services, state: { status: 'loading', dates: null } });
    try {
      const dates = await services.transactions.occupiedDates(
        { year, month: monthNumber },
        timeZone,
      );
      if (
        mounted.current &&
        request === generation.current &&
        key === currentKey.current &&
        services === currentServices.current
      ) {
        setResult({ key, services, state: { status: 'ready', dates } });
      }
    } catch {
      if (
        mounted.current &&
        request === generation.current &&
        key === currentKey.current &&
        services === currentServices.current
      ) {
        setResult({ key, services, state: { status: 'error', dates: null } });
      }
    }
  }, [services, enabled, key, year, monthNumber, timeZone]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, []);
  useEffect(() => {
    refresh();
    return () => {
      generation.current += 1;
    };
  }, [refresh]);
  const invalidate = useCallback(() => {
    if (key !== currentKey.current || services !== currentServices.current) {
      return;
    }
    // Commit invalidates synchronously; repeated notifications share one next read.
    generation.current += 1;
    if (!enabled || !mounted.current) {
      return;
    }
    setResult({ key, services, state: { status: 'loading', dates: null } });
    if (
      scheduled.current?.key === key &&
      scheduled.current.services === services
    ) {
      return;
    }
    const token = { key, services };
    scheduled.current = token;
    Promise.resolve().then(() => {
      if (scheduled.current === token) {
        scheduled.current = null;
      }
      if (
        mounted.current &&
        key === currentKey.current &&
        services === currentServices.current
      ) {
        refresh();
      }
    });
  }, [enabled, key, services, refresh]);
  useDataChanges(
    useCallback(
      change => {
        if (change === 'transactions') {
          invalidate();
        }
      },
      [invalidate],
    ),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        invalidate();
      }
    });
    return () => subscription.remove();
  }, [invalidate]);
  const state: OccupiedDatesState = !enabled
    ? { status: 'idle', dates: null }
    : result.key === key && result.services === services
    ? result.state
    : { status: 'loading', dates: null };
  return { state, refresh, retry: refresh };
}
