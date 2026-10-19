import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useDataChanges } from '../app/useDataChanges';

export type ActivityStatus = 'idle' | 'loading' | 'error' | 'ready';

// Each mounted calendar owns its bounded cache; disabled queries still observe commits.
export function useCalendarActivity<T>(
  key: string,
  enabled: boolean,
  limit: number,
  read: (
    services: ReturnType<typeof usePersistence>['services'],
  ) => Promise<T[]>,
) {
  const { services } = usePersistence();
  const store = useRef({ services, entries: new Map<string, T[]>() });
  if (store.current.services !== services)
    store.current = { services, entries: new Map() };
  const current = useRef({ key, enabled, services, read });
  current.current = { key, enabled, services, read };
  const mounted = useRef(false);
  const generation = useRef(0);
  const scheduled = useRef<object | null>(null);
  const [result, setResult] = useState<{
    key: string;
    enabled: boolean;
    services: typeof services;
    status: ActivityStatus;
    requestId: number;
  } | null>(null);
  const matches = useCallback(
    () =>
      mounted.current &&
      current.current.key === key &&
      current.current.enabled === enabled &&
      current.current.services === services,
    [key, enabled, services],
  );
  const refresh = useCallback(async () => {
    if (!enabled || !matches()) return;
    const requestId = ++generation.current;
    setResult({ key, enabled, services, status: 'loading', requestId });
    try {
      const data = await current.current.read(services);
      if (!matches() || requestId !== generation.current) return;
      const entries = store.current.entries;
      entries.delete(key);
      entries.set(key, data);
      while (entries.size > limit) entries.delete(entries.keys().next().value!);
      setResult({ key, enabled, services, status: 'ready', requestId });
    } catch {
      if (matches() && requestId === generation.current)
        setResult({ key, enabled, services, status: 'error', requestId });
    }
  }, [enabled, matches, key, services, limit]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      scheduled.current = null;
    };
  }, []);
  useEffect(() => {
    const entries = store.current.entries;
    const data = entries.get(key);
    if (data !== undefined) {
      entries.delete(key);
      entries.set(key, data);
    }
    refresh();
    return () => {
      generation.current += 1;
      scheduled.current = null;
    };
  }, [key, refresh]);
  const invalidate = useCallback(
    (clear: boolean) => {
      if (!mounted.current || current.current.services !== services) return;
      generation.current += 1;
      if (clear) store.current.entries.clear();
      // A previous effect's subscription may receive a commit between render
      // and effect replacement. Invalidate its cache even if the key changed.
      if (!matches()) return;
      setResult({
        key,
        enabled,
        services,
        status: enabled ? 'loading' : 'idle',
        requestId: generation.current,
      });
      if (!enabled || scheduled.current) return;
      const token = {};
      scheduled.current = token;
      Promise.resolve().then(() => {
        if (scheduled.current !== token) return;
        scheduled.current = null;
        if (matches()) refresh();
      });
    },
    [enabled, key, services, matches, refresh],
  );
  useDataChanges(
    useCallback(
      change => {
        if (change === 'transactions') invalidate(true);
      },
      [invalidate],
    ),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') invalidate(false);
    });
    return () => listener.remove();
  }, [invalidate]);
  const matching =
    result?.key === key &&
    result.enabled === enabled &&
    result.services === services;
  const status: ActivityStatus = !enabled
    ? 'idle'
    : matching
    ? result.status
    : 'loading';
  return {
    status,
    data: enabled ? store.current.entries.get(key) ?? null : null,
    requestId: matching ? result.requestId : 0,
    refresh,
  };
}
