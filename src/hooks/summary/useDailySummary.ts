import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';
import { useLocalClock } from '../app/useLocalClock';
import { getPeriodBounds, isWithinPeriod } from '../../features/summary/periods';
import { CashSummary, summarizeTransactions } from '../../features/summary/summary';

type DailyState =
  | { status: 'loading'; summary: null }
  | { status: 'error'; summary: null }
  | { status: 'ready'; summary: CashSummary };

export function useDailySummary(clock: ReturnType<typeof useLocalClock>) {
  const { services } = usePersistence();
  const [state, setState] = useState<DailyState>({
    status: 'loading',
    summary: null,
  });
  const request = useRef(0);
  const mounted = useRef(false);
  const currentClock = useRef(clock);
  currentClock.current = clock;
  const refresh = useCallback(async () => {
    const generation = ++request.current;
    setState({ status: 'loading', summary: null });
    try {
      const { now, timeZone } = currentClock.current;
      const bounds = getPeriodBounds(now, 'day', timeZone);
      const rows = await services.transactions.list();
      const summary = summarizeTransactions(
        rows.filter(row => isWithinPeriod(new Date(row.createdAt), bounds)),
      );
      if (mounted.current && generation === request.current) {
        setState({ status: 'ready', summary });
      }
    } catch {
      if (mounted.current && generation === request.current) {
        setState({ status: 'error', summary: null });
      }
    }
  }, [services]);
  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh, clock.dayKey, clock.timeZone]);
  const onChange = useCallback(
    (change: 'transactions' | 'preferences') => {
      if (change === 'transactions') {
        refresh();
      }
    },
    [refresh],
  );
  useDataChanges(onChange);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);
  return { state, refresh };
}
