import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { usePersistence } from '../PersistenceProvider/PersistenceProvider';
import { DELETION_UNDO_SECONDS } from '../../features/transactions/deletionConstants';

type DeletionState =
  | { status: 'idle'; id: null }
  | { status: 'pending' | 'writing' | 'error'; id: string };
interface DeletionContextValue {
  state: DeletionState;
  begin: (id: string) => void;
  undo: () => void;
  retry: () => void;
  cancelError: () => void;
  allStatus: 'idle' | 'writing' | 'error' | 'success';
  clearAll: () => Promise<boolean>;
}
const DeletionContext = createContext<DeletionContextValue | undefined>(
  undefined,
);

export function DeletionProvider({ children }: React.PropsWithChildren) {
  const { services } = usePersistence();
  const [allStatus, setAllStatus] =
    useState<DeletionContextValue['allStatus']>('idle');
  const allWriting = useRef(false);
  const [state, setState] = useState<DeletionState>({
    status: 'idle',
    id: null,
  });
  const current = useRef<DeletionState>(state);
  const active = useRef(AppState.currentState === 'active');
  const mounted = useRef(true);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const change = useCallback((next: DeletionState) => {
    current.current = next;
    if (mounted.current) {
      setState(next);
    }
  }, []);
  const clearTimer = useCallback(() => {
    if (timeout.current !== null) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, []);
  const undo = useCallback(() => {
    if (current.current.status !== 'pending') {
      return;
    }
    clearTimer();
    change({ status: 'idle', id: null });
  }, [change, clearTimer]);
  const commit = useCallback(async () => {
    if (!mounted.current || allWriting.current) {
      return;
    }
    const pending = current.current;
    if (pending.status !== 'pending' && pending.status !== 'error') {
      return;
    }
    if (!active.current || AppState.currentState !== 'active') {
      if (pending.status === 'pending') {
        undo();
      }
      return;
    }
    clearTimer();
    // Synchronous transition wins the undo/expiry race before the first await.
    change({ status: 'writing', id: pending.id });
    try {
      await services.transactions.remove(pending.id);
      change({ status: 'idle', id: null });
    } catch {
      change({ status: 'error', id: pending.id });
    }
  }, [change, clearTimer, services, undo]);
  const begin = useCallback(
    (id: string) => {
      if (
        !mounted.current ||
        current.current.status !== 'idle' ||
        allWriting.current ||
        !active.current ||
        AppState.currentState !== 'active'
      ) {
        return;
      }
      change({ status: 'pending', id });
      timeout.current = setTimeout(commit, DELETION_UNDO_SECONDS * 1000);
    },
    [change, commit],
  );
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', next => {
      active.current = next === 'active';
      if (!active.current) {
        undo();
      }
    });
    return () => {
      mounted.current = false;
      clearTimer();
      current.current = { status: 'idle', id: null };
      subscription.remove();
    };
  }, [clearTimer, undo]);
  const clearAll = useCallback(async () => {
    // Recheck after native confirmation; synchronous lock also covers double taps.
    if (
      !mounted.current ||
      current.current.status !== 'idle' ||
      allWriting.current
    ) {
      return false;
    }
    allWriting.current = true;
    setAllStatus('writing');
    try {
      await services.transactions.removeAll();
      if (mounted.current) {
        setAllStatus('success');
      }
      return true;
    } catch {
      if (mounted.current) {
        setAllStatus('error');
      }
      return false;
    } finally {
      allWriting.current = false;
    }
  }, [services]);
  useEffect(() => {
    if (allStatus !== 'success') {
      return;
    }
    const timer = setTimeout(() => setAllStatus('idle'), 4000);
    return () => clearTimeout(timer);
  }, [allStatus]);
  return (
    <DeletionContext.Provider
      value={{
        state,
        allStatus,
        clearAll,
        begin,
        undo,
        retry: commit,
        cancelError: () => {
          if (current.current.status === 'error') {
            change({ status: 'idle', id: null });
          }
        },
      }}
    >
      {children}
    </DeletionContext.Provider>
  );
}
export function useDeletion() {
  const value = useContext(DeletionContext);
  if (!value) {
    throw new Error('DeletionProvider is required');
  }
  return value;
}
