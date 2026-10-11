import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';

type ExistenceState =
  | { status: 'loading' | 'error'; hasAny: null }
  | { status: 'ready'; hasAny: boolean };

// A filtered empty page cannot establish that the database has no operations.
export function useHasTransactions() {
  const { services } = usePersistence();
  const currentServices = useRef(services);
  currentServices.current = services;
  const generation = useRef(0);
  const mounted = useRef(false);
  const [result, setResult] = useState<{
    services: typeof services;
    state: ExistenceState;
  }>({ services, state: { status: 'loading', hasAny: null } });
  const refresh = useCallback(async () => {
    if (!mounted.current || services !== currentServices.current) {
      return;
    }
    const request = ++generation.current;
    setResult({ services, state: { status: 'loading', hasAny: null } });
    try {
      const hasAny = await services.transactions.hasAny();
      if (
        mounted.current &&
        services === currentServices.current &&
        request === generation.current
      ) {
        setResult({ services, state: { status: 'ready', hasAny } });
      }
    } catch {
      if (
        mounted.current &&
        services === currentServices.current &&
        request === generation.current
      ) {
        setResult({ services, state: { status: 'error', hasAny: null } });
      }
    }
  }, [services]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
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
          refresh();
        }
      },
      [refresh],
    ),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);
  const state: ExistenceState =
    services === result.services
      ? result.state
      : { status: 'loading', hasAny: null };
  return { state, refresh };
}
