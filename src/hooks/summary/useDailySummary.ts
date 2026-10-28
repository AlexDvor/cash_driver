import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';
import { useLocalClock } from '../app/useLocalClock';
import { useCoalescedRefresh } from '../app/useCoalescedRefresh';
import { getPeriodBounds } from '../../features/summary/periods';
import { CashSummary } from '../../features/summary/summary';

type DailyState =
  | { status: 'loading'; summary: null }
  | { status: 'error'; summary: null }
  | { status: 'ready'; summary: CashSummary };

export function useDailySummary(clock: ReturnType<typeof useLocalClock>) {
  const { services } = usePersistence();
  const bounds = getPeriodBounds(clock.now, 'day', clock.timeZone);
  const start = bounds.start.getTime();
  const end = bounds.end.getTime();
  const key = `${clock.timeZone}/${start}/${end}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const currentServices = useRef(services);
  currentServices.current = services;
  const [result, setResult] = useState<{
    key: string;
    services: typeof services;
    state: DailyState;
    retainedSummary: CashSummary | null;
  }>({
    key,
    services,
    state: { status: 'loading', summary: null },
    retainedSummary: null,
  });
  const request = useRef(0);
  const mounted = useRef(false);
  const beginRefresh = useCallback(() => {
    if (
      !mounted.current ||
      key !== currentKey.current ||
      services !== currentServices.current
    ) {
      return false;
    }
    request.current += 1;
    setResult(previous => ({
      key,
      services,
      state: { status: 'loading', summary: null },
      retainedSummary:
        previous.key === key && previous.services === services
          ? previous.state.summary ?? previous.retainedSummary
          : null,
    }));
    return true;
  }, [key, services]);
  const refresh = useCallback(async () => {
    if (!beginRefresh()) return;
    const generation = request.current;
    const isCurrent = () =>
      mounted.current &&
      generation === request.current &&
      key === currentKey.current &&
      services === currentServices.current;
    try {
      const readBounds = { start: new Date(start), end: new Date(end) };
      const summary = await services.transactions.summarizeCompatible(
        readBounds,
      );
      if (isCurrent()) {
        setResult({
          key,
          services,
          state: { status: 'ready', summary },
          retainedSummary: null,
        });
      }
    } catch {
      if (isCurrent()) {
        setResult(previous => ({
          ...previous,
          state: { status: 'error', summary: null },
        }));
      }
    }
  }, [beginRefresh, services, key, start, end]);
  const invalidate = useCoalescedRefresh(refresh, beginRefresh);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current += 1;
    };
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const onChange = useCallback(
    (change: 'transactions' | 'preferences') => {
      if (change === 'transactions') {
        invalidate();
      }
    },
    [invalidate],
  );
  useDataChanges(onChange);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        invalidate();
      }
    });
    return () => subscription.remove();
  }, [invalidate]);
  // Hide the previous day/timezone/service synchronously, before effects run.
  const sameQuery = result.key === key && result.services === services;
  const state: DailyState = sameQuery
    ? result.state
    : { status: 'loading', summary: null };
  const retainedSummary = sameQuery ? result.retainedSummary : null;
  return {
    state,
    refresh,
    retainedSummary,
    refreshing: state.status === 'loading' && retainedSummary !== null,
    refreshError: state.status === 'error' && retainedSummary !== null,
  };
}
