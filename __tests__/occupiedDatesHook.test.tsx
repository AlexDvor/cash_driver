import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { useOccupiedDates } from '../src/hooks/summary/useOccupiedDates';
import { createChangeNotifier } from '../src/app/changeNotifier';

const changes = createChangeNotifier();
const occupiedDates = jest.fn();
jest.mock('../src/providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistence: () => ({ services: mockServices }),
}));
let mockServices = { changes, transactions: { occupiedDates } };
function deferred() {
  let resolve!: (value: string[]) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string[]>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
test('stale refresh cannot invalidate new query and replacement service hides prior data', async () => {
  const first = deferred();
  const next = deferred();
  const replacement = deferred();
  occupiedDates
    .mockReset()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(next.promise)
    .mockReturnValueOnce(replacement.promise);
  let month = { year: 2026, month: 10 };
  let current: ReturnType<typeof useOccupiedDates>;
  function Probe() {
    current = useOccupiedDates(month, 'UTC');
    return null;
  }
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  const staleRefresh = current!.refresh;
  month = { year: 2026, month: 11 };
  await act(async () => {
    renderer!.update(<Probe />);
  });
  await act(async () => {
    await staleRefresh();
    next.resolve(['2026-11-01']);
  });
  expect(current!.state.dates).toEqual(['2026-11-01']);
  expect(occupiedDates).toHaveBeenCalledTimes(2);
  mockServices = { ...mockServices };
  await act(async () => {
    renderer!.update(<Probe />);
  });
  expect(current!.state.dates).toBeNull();
  await act(async () => {
    first.resolve(['2026-10-01']);
    replacement.resolve(['2026-11-02']);
  });
  expect(current!.state.dates).toEqual(['2026-11-02']);
  await act(async () => {
    renderer!.unmount();
  });
});
test('markers reject old month and precommit responses, coalesce commits, retry and clean up', async () => {
  const old = deferred();
  const newer = deferred();
  const committed = deferred();
  occupiedDates
    .mockReset()
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(newer.promise)
    .mockReturnValueOnce(committed.promise);
  let month = { year: 2026, month: 10 };
  let current: ReturnType<typeof useOccupiedDates>;
  function Probe() {
    current = useOccupiedDates(month, 'UTC');
    return null;
  }
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  month = { year: 2026, month: 11 };
  await act(async () => {
    renderer!.update(<Probe />);
  });
  await act(async () => {
    old.resolve(['2026-10-01']);
  });
  expect(current!.state).toEqual({ status: 'loading', dates: null });
  await act(async () => {
    changes.notify('transactions');
    changes.notify('transactions');
    newer.resolve(['2026-11-01']);
  });
  expect(occupiedDates).toHaveBeenCalledTimes(3);
  expect(current!.state.dates).toBeNull();
  await act(async () => {
    committed.reject(new Error('failed'));
  });
  expect(current!.state.status).toBe('error');
  occupiedDates.mockResolvedValueOnce([]);
  await act(async () => {
    await current!.retry();
  });
  expect(current!.state).toEqual({ status: 'ready', dates: [] });
  expect(occupiedDates).toHaveBeenLastCalledWith(
    { year: 2026, month: 11 },
    'UTC',
  );
  await act(async () => {
    renderer!.unmount();
  });
  await act(async () => {
    changes.notify('transactions');
  });
  expect(occupiedDates).toHaveBeenCalledTimes(4);
});

test('disabled modal does not read, timezone hides old dates, resume refreshes and removes listener', async () => {
  const listeners = new Set<(state: AppStateStatus) => void>();
  const remove = jest.fn();
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      listeners.add(listener);
      return {
        remove: () => {
          remove();
          listeners.delete(listener);
        },
      };
    });
  const inFlight = deferred();
  occupiedDates
    .mockReset()
    .mockResolvedValueOnce(['2026-10-01'])
    .mockReturnValueOnce(inFlight.promise)
    .mockResolvedValueOnce(['2026-10-02']);
  let enabled = false;
  let zone = 'UTC';
  let current: ReturnType<typeof useOccupiedDates>;
  function Probe() {
    current = useOccupiedDates({ year: 2026, month: 10 }, zone, enabled);
    return null;
  }
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  expect(current!.state.status).toBe('idle');
  expect(occupiedDates).not.toHaveBeenCalled();
  enabled = true;
  await act(async () => {
    renderer!.update(<Probe />);
  });
  expect(current!.state.dates).toEqual(['2026-10-01']);
  zone = 'America/New_York';
  await act(async () => {
    renderer!.update(<Probe />);
  });
  expect(current!.state.dates).toBeNull();
  await act(async () => {
    listeners.forEach(listener => listener('active'));
  });
  expect(current!.state.dates).toEqual(['2026-10-02']);
  await act(async () => {
    inFlight.resolve(['2026-10-03']);
  });
  expect(current!.state.dates).toEqual(['2026-10-02']);
  await act(async () => {
    renderer!.unmount();
  });
  expect(listeners.size).toBe(0);
  expect(remove).toHaveBeenCalled();
  subscription.mockRestore();
});
