import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';
import { useCoalescedRefresh } from '../app/useCoalescedRefresh';
import { useLocalClock } from '../app/useLocalClock';
import {
  getPeriodBounds,
  getCalendarDayBounds,
  getCalendarMonthBounds,
  CalendarDate,
  CalendarMonth,
  SummaryPeriod,
} from '../../features/summary/periods';
import { CashSummary } from '../../features/summary/summary';

type SummaryState =
  | { status: 'loading'; summary: null }
  | { status: 'error'; summary: null }
  | { status: 'ready'; summary: CashSummary };

export function usePeriodSummary(
  period: SummaryPeriod,
  clock: ReturnType<typeof useLocalClock>,
  selection?: Readonly<CalendarMonth | CalendarDate>,
) {
  const { services } = usePersistence();
  let bounds = getPeriodBounds(clock.now, period, clock.timeZone);
  if (period === 'month' && selection) {
    bounds =
      'day' in selection
        ? getCalendarDayBounds(selection, clock.timeZone)
        : getCalendarMonthBounds(selection, clock.timeZone);
  }
  const start = bounds.start.getTime();
  const end = bounds.end.getTime();
  // Calendar coordinates remain pinned; clock ticks only change queries when
  // their actual local period or timezone changes.
  const key = `${period}/${clock.timeZone}/${start}/${end}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const currentServices = useRef(services);
  currentServices.current = services;
  const request = useRef(0);
  const mounted = useRef(true);
  const [result, setResult] = useState<{
    key: string;
    services: typeof services;
    state: SummaryState;
    retainedSummary: CashSummary | null;
  }>({
    key,
    services,
    state: { status: 'loading', summary: null },
    retainedSummary: null,
  });
  const refresh = useCallback(async () => {
    if (
      !mounted.current ||
      key !== currentKey.current ||
      services !== currentServices.current
    ) {
      return;
    }
    const generation = ++request.current;
    setResult(previous => ({
      key,
      services,
      state: { status: 'loading', summary: null },
      retainedSummary:
        previous.key === key && previous.services === services
          ? previous.state.summary ?? previous.retainedSummary
          : null,
    }));
    try {
      const summary = await services.transactions.summarize({
        start: new Date(start),
        end: new Date(end),
      });
      if (
        mounted.current &&
        generation === request.current &&
        key === currentKey.current &&
        services === currentServices.current
      ) {
        setResult({
          key,
          services,
          state: { status: 'ready', summary },
          retainedSummary: null,
        });
      }
    } catch {
      if (
        mounted.current &&
        generation === request.current &&
        key === currentKey.current &&
        services === currentServices.current
      ) {
        setResult(previous => ({
          ...previous,
          state: { status: 'error', summary: null },
        }));
      }
    }
  }, [services, key, start, end]);

  const invalidate = useCoalescedRefresh(
    refresh,
    useCallback(() => {
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
    }, [key, services]),
  );

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
          invalidate();
        }
      },
      [invalidate],
    ),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        invalidate();
      }
    });
    return () => subscription.remove();
  }, [invalidate]);

  // Do not expose the previous period even before its next effect starts.
  const sameQuery = result.key === key && result.services === services;
  const state: SummaryState = sameQuery
    ? result.state
    : { status: 'loading', summary: null };
  const retainedSummary = sameQuery ? result.retainedSummary : null;
  return {
    state,
    bounds,
    refresh,
    retainedSummary,
    refreshing: state.status === 'loading' && retainedSummary !== null,
    refreshError: state.status === 'error' && retainedSummary !== null,
  };
}
