import React, { useEffect as mockUseEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { createChangeNotifier } from '../../app/changeNotifier';
import { useHasTransactions } from './useHasTransactions';

jest.mock('../../providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistence: () => ({ services: mockServices }),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) =>
    mockUseEffect(callback, [callback]),
}));

function services() {
  return {
    changes: createChangeNotifier(),
    transactions: { hasAny: jest.fn<Promise<boolean>, []>() },
  };
}
let mockServices = services();

function deferred() {
  let resolve!: (value: boolean) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<boolean>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}

async function mountProbe() {
  let current!: ReturnType<typeof useHasTransactions>;
  function Probe() {
    current = useHasTransactions();
    return null;
  }
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  return {
    current: () => current,
    update: async () => {
      await act(async () => {
        renderer.update(<Probe />);
      });
    },
    unmount: async () => {
      await act(async () => {
        renderer.unmount();
      });
    },
  };
}

beforeEach(() => {
  mockServices = services();
});

test('unknown and failed existence reads cannot imply a globally empty database; retry resolves empty', async () => {
  const pending = deferred();
  mockServices.transactions.hasAny.mockReturnValueOnce(pending.promise);
  const probe = await mountProbe();
  expect(probe.current().state).toEqual({ status: 'loading', hasAny: null });
  await act(async () => {
    pending.reject(new Error('storage read failed'));
  });
  expect(probe.current().state).toEqual({ status: 'error', hasAny: null });
  mockServices.transactions.hasAny.mockResolvedValueOnce(false);
  await act(async () => {
    await probe.current().refresh();
  });
  expect(probe.current().state).toEqual({ status: 'ready', hasAny: false });
  expect(mockServices.transactions.hasAny).toHaveBeenLastCalledWith();
  await probe.unmount();
});

test('refresh hides previous global emptiness and ignores an older response', async () => {
  mockServices.transactions.hasAny.mockResolvedValueOnce(false);
  const probe = await mountProbe();
  expect(probe.current().state).toEqual({ status: 'ready', hasAny: false });
  const older = deferred();
  const newest = deferred();
  mockServices.transactions.hasAny
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(newest.promise);
  let oldRefresh!: Promise<void>;
  let newRefresh!: Promise<void>;
  act(() => {
    oldRefresh = probe.current().refresh();
  });
  expect(probe.current().state).toEqual({ status: 'loading', hasAny: null });
  act(() => {
    newRefresh = probe.current().refresh();
  });
  await act(async () => {
    newest.resolve(true);
    await newRefresh;
  });
  await act(async () => {
    older.resolve(false);
    await oldRefresh;
  });
  expect(probe.current().state).toEqual({ status: 'ready', hasAny: true });
  await probe.unmount();
});

test('only committed transaction notifications refresh existence and discard precommit emptiness', async () => {
  const beforeCommit = deferred();
  const afterCommit = deferred();
  mockServices.transactions.hasAny
    .mockReturnValueOnce(beforeCommit.promise)
    .mockReturnValueOnce(afterCommit.promise);
  const probe = await mountProbe();
  await act(async () => {
    mockServices.changes.notify('preferences');
  });
  expect(mockServices.transactions.hasAny).toHaveBeenCalledTimes(1);
  await act(async () => {
    mockServices.changes.notify('transactions');
    beforeCommit.resolve(false);
  });
  expect(probe.current().state).toEqual({ status: 'loading', hasAny: null });
  expect(mockServices.transactions.hasAny).toHaveBeenCalledTimes(2);
  await act(async () => {
    afterCommit.resolve(true);
  });
  expect(probe.current().state).toEqual({ status: 'ready', hasAny: true });
  await probe.unmount();
});

test('replacement persistence hides old state and rejects stale refresh callbacks and responses', async () => {
  mockServices.transactions.hasAny.mockResolvedValueOnce(false);
  const oldServices = mockServices;
  const probe = await mountProbe();
  const staleRefresh = probe.current().refresh;
  const oldRequest = deferred();
  oldServices.transactions.hasAny.mockReturnValueOnce(oldRequest.promise);
  let oldRefresh!: Promise<void>;
  act(() => {
    oldRefresh = probe.current().refresh();
  });
  const nextRequest = deferred();
  mockServices = services();
  mockServices.transactions.hasAny.mockReturnValueOnce(nextRequest.promise);
  await probe.update();
  expect(probe.current().state).toEqual({ status: 'loading', hasAny: null });
  await act(async () => {
    await staleRefresh();
    oldServices.changes.notify('transactions');
    oldRequest.resolve(false);
    await oldRefresh;
    nextRequest.resolve(true);
  });
  expect(oldServices.transactions.hasAny).toHaveBeenCalledTimes(2);
  expect(mockServices.transactions.hasAny).toHaveBeenCalledTimes(1);
  expect(probe.current().state).toEqual({ status: 'ready', hasAny: true });
  await probe.unmount();
});

test('resume refreshes existence while background does not, and unmount cleans subscriptions and pending work', async () => {
  const listeners = new Set<(state: AppStateStatus) => void>();
  const listenerSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    });
  try {
    mockServices.transactions.hasAny.mockResolvedValueOnce(true);
    const probe = await mountProbe();
    await act(async () => {
      listeners.forEach(listener => listener('background'));
    });
    expect(mockServices.transactions.hasAny).toHaveBeenCalledTimes(1);
    const resumed = deferred();
    mockServices.transactions.hasAny.mockReturnValueOnce(resumed.promise);
    await act(async () => {
      listeners.forEach(listener => listener('active'));
    });
    expect(probe.current().state).toEqual({ status: 'loading', hasAny: null });
    const staleRefresh = probe.current().refresh;
    await probe.unmount();
    expect(listeners.size).toBe(0);
    await act(async () => {
      mockServices.changes.notify('transactions');
      await staleRefresh();
      resumed.resolve(false);
    });
    expect(mockServices.transactions.hasAny).toHaveBeenCalledTimes(2);
  } finally {
    listenerSpy.mockRestore();
  }
});
