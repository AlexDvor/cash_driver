import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDataChanges } from '../app/useDataChanges';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { CashTransaction } from '../../features/transactions/types';

type RecordsState =
  | { status: 'loading' | 'error'; records: null }
  | { status: 'ready'; records: CashTransaction[] };

// Edit loads once: refreshing its parent during a commit must not remount a draft.
export function useTransactions(id?: string, live = true) {
  const { services } = usePersistence();
  const [state, setState] = useState<RecordsState>({
    status: 'loading',
    records: null,
  });
  const generation = useRef(0);
  const mounted = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setState({ status: 'loading', records: null });
    try {
      const record =
        id === undefined ? undefined : await services.transactions.get(id);
      const records =
        id === undefined
          ? await services.transactions.list()
          : record
          ? [record]
          : [];
      if (mounted.current && request === generation.current) {
        setState({ status: 'ready', records });
      }
    } catch {
      if (mounted.current && request === generation.current) {
        setState({ status: 'error', records: null });
      }
    }
  }, [id, services]);
  useEffect(() => {
    mounted.current = true;
    if (!live) {
      refresh();
    }
    return () => {
      mounted.current = false;
    };
  }, [live, refresh]);
  useFocusEffect(
    useCallback(() => {
      if (live) {
        refresh();
      }
    }, [live, refresh]),
  );
  useDataChanges(
    useCallback(
      change => {
        if (live && change === 'transactions') {
          refresh();
        }
      },
      [live, refresh],
    ),
  );
  useEffect(() => {
    if (!live) {
      return;
    }
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [live, refresh]);
  return { state, refresh };
}
