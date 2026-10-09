import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';
import { useLocalClock } from '../app/useLocalClock';
import { getPeriodBounds, isWithinPeriod, SummaryPeriod } from '../../features/summary/periods';
import { CashSummary, summarizeTransactions } from '../../features/summary/summary';

type SummaryState =
  | { status: 'loading'; summary: null }
  | { status: 'error'; summary: null }
  | { status: 'ready'; summary: CashSummary };

export function usePeriodSummary(
  period: SummaryPeriod,
  clock: ReturnType<typeof useLocalClock>,
) {
  const { services } = usePersistence();
  const bounds = getPeriodBounds(clock.now, period, clock.timeZone);
  const start = bounds.start.getTime();
  const end = bounds.end.getTime();
  const key = `${period}/${clock.dayKey}/${clock.timeZone}/${start}/${end}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const request = useRef(0);
  const mounted = useRef(true);
  const [result, setResult] = useState<{ key: string; state: SummaryState }>({
    key,
    state: { status: 'loading', summary: null },
  });
  const refresh = useCallback(async () => {
    const generation = ++request.current;
    setResult({ key, state: { status: 'loading', summary: null } });
    try {
      const rows = await services.transactions.list();
      const summary = summarizeTransactions(
        rows.filter(row =>
          isWithinPeriod(new Date(row.createdAt), {
            start: new Date(start),
            end: new Date(end),
          }),
        ),
      );
      if (
        mounted.current &&
        generation === request.current &&
        key === currentKey.current
      ) {
        setResult({ key, state: { status: 'ready', summary } });
      }
    } catch {
      if (
        mounted.current &&
        generation === request.current &&
        key === currentKey.current
      ) {
        setResult({ key, state: { status: 'error', summary: null } });
      }
    }
  }, [services, key, start, end]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current += 1;
    };
  }, []);
  // Also runs when a focused screen's local day, timezone or period changes.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  useDataChanges(
    useCallback(
      change => {
        if (change === 'transactions') {
          refresh();
        }
      },
      [refresh],
    ),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  // Do not expose the previous period even before its next effect starts.
  const state: SummaryState =
    result.key === key ? result.state : { status: 'loading', summary: null };
  return { state, bounds, refresh };
}
