import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';
import { useCoalescedRefresh } from '../app/useCoalescedRefresh';
import {
  HistoryCursor,
  HistoryReadFilter,
} from '../../features/transactions/transactionReadContracts';
import { CashTransaction } from '../../features/transactions/types';

export interface PagedTransactionsState {
  status: 'loading' | 'ready' | 'error';
  records: CashTransaction[] | null;
  refreshing: boolean;
  refreshError: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  hasMore: boolean;
  empty: boolean;
}

const initialState: PagedTransactionsState = {
  status: 'loading',
  records: null,
  refreshing: false,
  refreshError: false,
  loadingMore: false,
  loadMoreError: false,
  hasMore: false,
  empty: false,
};

// History only: useTransactions(id, false) continues to own edit/detail loading.
export function usePagedTransactions(filter: HistoryReadFilter) {
  const { services } = usePersistence();
  const start = filter.bounds?.start.getTime();
  const end = filter.bounds?.end.getTime();
  const platform = filter.platform;
  const key = JSON.stringify([start ?? null, end ?? null, platform ?? null]);
  const current = useRef({ key, services });
  current.current = { key, services };
  const generation = useRef(0);
  const mounted = useRef(false);
  const cursor = useRef<HistoryCursor | null>(null);
  const snapshot = useRef({ key, services, state: initialState });
  const [result, setResult] = useState(snapshot.current);
  const publish = useCallback(
    (state: PagedTransactionsState) => {
      snapshot.current = { key, services, state };
      setResult(snapshot.current);
    },
    [key, services],
  );
  const isCurrent = useCallback(
    (request: number) =>
      mounted.current &&
      request === generation.current &&
      current.current.key === key &&
      current.current.services === services,
    [key, services],
  );
  const readFilter = useCallback(
    (): HistoryReadFilter => ({
      ...(start !== undefined && end !== undefined
        ? { bounds: { start: new Date(start), end: new Date(end) } }
        : {}),
      platform,
    }),
    [start, end, platform],
  );
  const refresh = useCallback(async () => {
    if (
      !mounted.current ||
      key !== current.current.key ||
      services !== current.current.services
    ) {
      return;
    }
    const request = ++generation.current;
    cursor.current = null;
    const previous = snapshot.current;
    const records =
      previous.key === key && previous.services === services
        ? previous.state.records
        : null;
    publish({
      ...initialState,
      status: records ? 'ready' : 'loading',
      records,
      refreshing: records !== null,
      empty: records?.length === 0,
    });
    try {
      const page = await services.transactions.listPage(readFilter());
      if (isCurrent(request)) {
        cursor.current = page.nextCursor;
        publish({
          ...initialState,
          status: 'ready',
          records: page.records,
          hasMore: page.nextCursor !== null,
          empty: page.records.length === 0,
        });
      }
    } catch {
      if (isCurrent(request)) {
        publish({
          ...initialState,
          status: records ? 'ready' : 'error',
          records,
          refreshError: records !== null,
          empty: false,
        });
      }
    }
  }, [key, services, publish, isCurrent, readFilter]);

  const invalidate = useCoalescedRefresh(
    refresh,
    useCallback(() => {
      if (
        !mounted.current ||
        key !== current.current.key ||
        services !== current.current.services
      ) {
        return false;
      }
      generation.current += 1;
      cursor.current = null;
      const previous = snapshot.current;
      const records =
        previous.key === key && previous.services === services
          ? previous.state.records
          : null;
      publish({
        ...initialState,
        status: records ? 'ready' : 'loading',
        records,
        refreshing: records !== null,
        empty: records?.length === 0,
      });
      return true;
    }, [key, services, publish]),
  );

  const loadMore = useCallback(async () => {
    const previous = snapshot.current;
    const state = previous.state;
    if (
      !mounted.current ||
      previous.key !== key ||
      previous.services !== services ||
      current.current.key !== key ||
      current.current.services !== services ||
      state.status !== 'ready' ||
      state.refreshing ||
      state.refreshError ||
      state.loadingMore ||
      !state.hasMore ||
      !cursor.current ||
      !state.records
    ) {
      return;
    }
    const request = generation.current;
    const records = state.records;
    publish({ ...state, loadingMore: true, loadMoreError: false });
    try {
      const page = await services.transactions.listPage({
        ...readFilter(),
        cursor: cursor.current,
      });
      if (isCurrent(request)) {
        const seen = new Set(records.map(record => record.id));
        const additions = page.records.filter(record => {
          if (seen.has(record.id)) {
            return false;
          }
          seen.add(record.id);
          return true;
        });
        cursor.current = page.nextCursor;
        publish({
          ...state,
          records: [...records, ...additions],
          loadingMore: false,
          loadMoreError: false,
          hasMore: page.nextCursor !== null,
        });
      }
    } catch {
      if (isCurrent(request)) {
        publish({ ...state, loadingMore: false, loadMoreError: true });
      }
    }
  }, [key, services, publish, isCurrent, readFilter]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      cursor.current = null;
    };
  }, []);
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

  const state =
    result.key === key && result.services === services
      ? result.state
      : initialState;
  const retry = state.loadMoreError ? loadMore : refresh;
  return { state, refresh, loadMore, retry };
}
