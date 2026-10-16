import React, { useEffect as mockUseEffect } from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { usePagedTransactions } from './usePagedTransactions';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import {
  HistoryPage,
  HistoryReadFilter,
} from '../../features/transactions/transactionReadContracts';
import { CashTransaction } from '../../features/transactions/types';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from '../../test/sqliteTestDatabase';

jest.mock('../../providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistence: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) =>
    mockUseEffect(callback, [callback]),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}
function record(id: string): CashTransaction {
  return {
    id,
    ...validInput,
    createdAt: '2026-10-08T10:00:00.000Z',
    updatedAt: null,
    changeGivenCents: 0,
    netCashCents: 2000,
  };
}
function page(ids: string[], more = false): HistoryPage {
  return {
    records: ids.map(record),
    nextCursor: more
      ? {
          id: ids[ids.length - 1],
          createdAt: '2026-10-08T10:00:00.000Z',
          queryKey: 'query',
          revision: 0,
        }
      : null,
  };
}
async function fixture(filter: HistoryReadFilter = {}) {
  const db = openTestDatabase();
  const services = await testPersistence(db);
  jest.mocked(usePersistence).mockReturnValue({
    services,
    preferences: await services.preferences.read(),
    saving: false,
    errorKey: null,
    updatePreferences: async () => true,
    retryPreferences: async () => true,
  });
  const read = jest.spyOn(services.transactions, 'listPage');
  const fullRead = jest.spyOn(services.transactions, 'list');
  let current!: ReturnType<typeof usePagedTransactions>;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  let onState: ((next: AppStateStatus) => void) | undefined;
  const remove = jest.fn();
  const appState = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      onState = listener;
      return { remove };
    });
  function Probe({ query }: { query: HistoryReadFilter }) {
    current = usePagedTransactions(query);
    return null;
  }
  return {
    services,
    read,
    fullRead,
    current: () => current,
    remove,
    mount: async () => {
      await act(async () => {
        renderer = ReactTestRenderer.create(<Probe query={filter} />);
      });
    },
    change: async (query: HistoryReadFilter) => {
      await act(async () => renderer?.update(<Probe query={query} />));
    },
    resume: async () => {
      await act(async () => onState?.('active'));
    },
    unmount: async () => {
      await act(async () => renderer?.unmount());
      renderer = undefined;
    },
    close: async () => {
      await act(async () => renderer?.unmount());
      appState.mockRestore();
      db.close();
    },
  };
}

test('filter changes hide old records and late results cannot replace the selected query', async () => {
  const f = await fixture({ platform: 'uber' });
  const old = deferred<HistoryPage>();
  const selected = deferred<HistoryPage>();
  f.read.mockReturnValueOnce(old.promise).mockReturnValueOnce(selected.promise);
  try {
    await f.mount();
    await f.change({ platform: 'bolt' });
    expect(f.current().state.records).toBeNull();
    await act(async () => old.resolve(page(['old'])));
    expect(f.current().state.status).toBe('loading');
    await act(async () => selected.resolve(page(['selected'])));
    expect(f.current().state.records?.map(row => row.id)).toEqual(['selected']);
    expect(f.fullRead).not.toHaveBeenCalled();
  } finally {
    await f.close();
  }
});

test('one overlapping load-more request appends a page and footer retry preserves existing records', async () => {
  const f = await fixture();
  const next = deferred<HistoryPage>();
  f.read
    .mockResolvedValueOnce(page(['a'], true))
    .mockReturnValueOnce(next.promise)
    .mockResolvedValueOnce(page(['b']));
  try {
    await f.mount();
    await act(async () => {
      f.current().loadMore();
      f.current().loadMore();
    });
    expect(f.read).toHaveBeenCalledTimes(2);
    expect(f.current().state.loadingMore).toBe(true);
    await act(async () => next.reject(new Error('Read failed')));
    expect(f.current().state.records?.map(row => row.id)).toEqual(['a']);
    expect(f.current().state.loadMoreError).toBe(true);
    await act(async () => {
      await f.current().retry();
    });
    expect(f.current().state.records?.map(row => row.id)).toEqual(['a', 'b']);
    expect(f.current().state.hasMore).toBe(false);
    expect(f.current().state.loadMoreError).toBe(false);
  } finally {
    await f.close();
  }
});

test('same-query refresh retains data on error and retry replaces the previous pages', async () => {
  const f = await fixture();
  const refresh = deferred<HistoryPage>();
  f.read
    .mockResolvedValueOnce(page(['a'], true))
    .mockReturnValueOnce(refresh.promise)
    .mockResolvedValueOnce(page(['fresh']));
  try {
    await f.mount();
    await act(async () => {
      f.current().refresh();
    });
    expect(f.current().state.records?.map(row => row.id)).toEqual(['a']);
    expect(f.current().state.refreshing).toBe(true);
    await act(async () => refresh.reject(new Error('Offline read failed')));
    expect(f.current().state.refreshError).toBe(true);
    expect(f.current().state.records?.map(row => row.id)).toEqual(['a']);
    await act(async () => {
      await f.current().retry();
    });
    expect(f.current().state.records?.map(row => row.id)).toEqual(['fresh']);
    expect(f.current().state.refreshError).toBe(false);
  } finally {
    await f.close();
  }
});

test('a commit burst shares one page refresh and invalidates an older response immediately', async () => {
  const f = await fixture();
  const stale = deferred<HistoryPage>();
  const latest = deferred<HistoryPage>();
  f.read.mockReturnValueOnce(stale.promise).mockReturnValueOnce(latest.promise);
  try {
    await f.mount();
    await act(async () => {
      for (let i = 0; i < 20; i++) {
        f.services.changes.notify('transactions');
      }
      stale.resolve(page(['stale']));
    });
    expect(f.read).toHaveBeenCalledTimes(2);
    expect(f.current().state.records).toBeNull();
    await act(async () => latest.resolve(page(['latest'])));
    expect(f.current().state.records?.map(row => row.id)).toEqual(['latest']);
  } finally {
    await f.close();
  }
});

test('committed write discards an in-flight page; failed write does not invalidate reads', async () => {
  const f = await fixture();
  const stale = deferred<HistoryPage>();
  f.read
    .mockResolvedValueOnce(page(['a'], true))
    .mockReturnValueOnce(stale.promise)
    .mockResolvedValueOnce(page(['new']));
  try {
    await f.mount();
    await act(async () => {
      f.current().loadMore();
    });
    await act(async () => {
      await f.services.transactions.save(
        f.services.transactions.newPendingOperation(),
        validInput,
      );
    });
    await act(async () => stale.resolve(page(['stale'])));
    expect(f.current().state.records?.map(row => row.id)).toEqual(['new']);
    const reads = f.read.mock.calls.length;
    await act(async () => {
      await expect(
        f.services.transactions.save(
          f.services.transactions.newPendingOperation(),
          { ...validInput, fareAmountCents: -1 },
        ),
      ).rejects.toThrow();
    });
    expect(f.read).toHaveBeenCalledTimes(reads);
  } finally {
    await f.close();
  }
});

test('empty first result, initial error and recovery are distinct states', async () => {
  const f = await fixture();
  f.read
    .mockRejectedValueOnce(new Error('Read failed'))
    .mockResolvedValueOnce(page([]));
  try {
    await f.mount();
    expect(f.current().state.status).toBe('error');
    expect(f.current().state.empty).toBe(false);
    await act(async () => {
      await f.current().retry();
    });
    expect(f.current().state.status).toBe('ready');
    expect(f.current().state.empty).toBe(true);
    expect(f.current().state.hasMore).toBe(false);
  } finally {
    await f.close();
  }
});

test.each(['create', 'edit', 'remove', 'removeAll'] as const)(
  '%s commit resets pagination before an in-flight old page can merge',
  async action => {
    const f = await fixture();
    const saved = await f.services.transactions.save(
      f.services.transactions.newPendingOperation(),
      validInput,
    );
    const old = deferred<HistoryPage>();
    const replacement = deferred<HistoryPage>();
    f.read
      .mockResolvedValueOnce(page(['before'], true))
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(replacement.promise);
    try {
      await f.mount();
      await act(async () => {
        f.current().loadMore();
      });
      await act(async () => {
        if (action === 'create') {
          await f.services.transactions.save(
            f.services.transactions.newPendingOperation(),
            validInput,
          );
        } else if (action === 'edit') {
          await f.services.transactions.edit(saved.id, {
            ...validInput,
            tipCents: 0,
          });
        } else if (action === 'remove') {
          await f.services.transactions.remove(saved.id);
        } else {
          await f.services.transactions.removeAll();
        }
      });
      expect(f.read).toHaveBeenCalledTimes(3);
      expect(f.read.mock.calls[2][0]?.cursor).toBeUndefined();
      expect(f.current().state.loadingMore).toBe(false);
      await act(async () => old.resolve(page(['old-page'])));
      expect(
        f.current().state.records?.some(row => row.id === 'old-page'),
      ).not.toBe(true);
      await act(async () =>
        replacement.resolve(page(action === 'removeAll' ? [] : ['after'])),
      );
      expect(f.current().state.records?.map(row => row.id)).toEqual(
        action === 'removeAll' ? [] : ['after'],
      );
      expect(f.current().state.hasMore).toBe(false);
    } finally {
      await f.close();
    }
  },
);

test('resume starts a fresh first page and unmount removes listeners and ignores pending results', async () => {
  const f = await fixture();
  const late = deferred<HistoryPage>();
  f.read
    .mockResolvedValueOnce(page(['a'], true))
    .mockReturnValueOnce(late.promise)
    .mockResolvedValueOnce(page(['remounted']));
  try {
    await f.mount();
    await f.resume();
    expect(f.read.mock.calls[1][0]?.cursor).toBeUndefined();
    await f.unmount();
    expect(f.remove).toHaveBeenCalled();
    await act(async () => late.resolve(page(['late'])));
    await f.mount();
    expect(f.current().state.records?.map(row => row.id)).toEqual([
      'remounted',
    ]);
    expect(f.read).toHaveBeenCalledTimes(3);
  } finally {
    await f.close();
  }
});
