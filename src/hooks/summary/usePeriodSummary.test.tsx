import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { usePeriodSummary } from './usePeriodSummary';
import {
  SummaryPeriod,
  CalendarMonth,
  CalendarDate,
  PeriodBounds,
} from '../../features/summary/periods';
import {
  CashSummary,
  summarizeTransactions,
} from '../../features/summary/summary';
import { createChangeNotifier } from '../../app/changeNotifier';

jest.mock('../../providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistence: () => ({ services: mockServices }),
}));
jest.mock('@react-navigation/native', () => {
  const { useEffect } = jest.requireActual<typeof React>('react');
  return {
    useFocusEffect: (callback: () => void) => useEffect(callback, [callback]),
  };
});
let mockServices = {
  transactions: {
    summarize: jest.fn<Promise<CashSummary>, [PeriodBounds]>(),
  },
  changes: createChangeNotifier(),
};
function summary(count = 0): CashSummary {
  return { ...summarizeTransactions([]), operationCount: count };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
type Props = {
  period?: SummaryPeriod;
  selection?: CalendarMonth | CalendarDate;
  now?: string;
  timeZone?: string;
};
let current: ReturnType<typeof usePeriodSummary>;
let renderer: ReactTestRenderer.ReactTestRenderer;
let resume: (state: AppStateStatus) => void;
let removals: jest.Mock[];
function Probe({
  period = 'month',
  selection,
  now = '2026-10-11T10:00:00Z',
  timeZone = 'UTC',
}: Props) {
  current = usePeriodSummary(
    period,
    { now: new Date(now), timeZone, dayKey: now.slice(0, 10) },
    selection,
  );
  return null;
}
async function mount(props: Props = {}) {
  await act(async () => {
    renderer = ReactTestRenderer.create(<Probe {...props} />);
  });
}
async function update(props: Props) {
  await act(async () => {
    renderer.update(<Probe {...props} />);
  });
}
beforeEach(() => {
  mockServices.transactions.summarize.mockReset().mockResolvedValue(summary());
  removals = [];
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, callback) => {
      resume = callback;
      const remove = jest.fn();
      removals.push(remove);
      return { remove };
    });
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
  jest.restoreAllMocks();
});
test('legacy two-argument API requests only aggregate bounds and accepts genuine zero', async () => {
  await mount();
  expect(mockServices.transactions.summarize).toHaveBeenCalledWith({
    start: new Date('2026-10-01T00:00:00Z'),
    end: new Date('2026-11-01T00:00:00Z'),
  });
  expect(current.state).toEqual({ status: 'ready', summary: summary() });
});
test('explicit historical day is pinned across midnight, resolves DST, and day/week ignore selection', async () => {
  const selection = { year: 2026, month: 3, day: 29 };
  await mount({ selection, timeZone: 'Europe/Madrid' });
  expect(current.bounds).toEqual({
    start: new Date('2026-03-28T23:00:00Z'),
    end: new Date('2026-03-29T22:00:00Z'),
  });
  await update({
    selection,
    timeZone: 'Europe/Madrid',
    now: '2026-10-12T10:00:00Z',
  });
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(1);
  await update({ period: 'day', selection });
  expect(current.bounds.start).toEqual(new Date('2026-10-11T00:00:00Z'));
  await update({ period: 'week', selection });
  expect(current.bounds.start).toEqual(new Date('2026-10-05T00:00:00Z'));
});
test('clock ticks and pinned month daily rollover avoid extra queries, timezone recalculates bounds', async () => {
  const selection = { year: 2025, month: 7 };
  await mount({ selection });
  await update({ selection, now: '2026-10-11T10:00:01Z' });
  await update({ selection, now: '2026-10-12T10:00:01Z' });
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(1);
  await update({ selection, timeZone: 'Europe/Madrid' });
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(2);
  expect(current.bounds.start.toISOString()).toBe('2025-06-30T22:00:00.000Z');
});
test('automatic month and relative day roll forward at their actual local boundary', async () => {
  await mount({ now: '2026-10-31T23:59:59Z' });
  await update({ now: '2026-11-01T00:00:00Z' });
  expect(current.bounds.start.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  await update({ period: 'day', now: '2026-11-02T00:00:00Z' });
  expect(current.bounds.start.toISOString()).toBe('2026-11-02T00:00:00.000Z');
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(3);
});
test('rapid selection rejects older success and failure and hides old-query values', async () => {
  await mount();
  const older = deferred<CashSummary>();
  const newer = deferred<CashSummary>();
  mockServices.transactions.summarize
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(newer.promise);
  await update({ selection: { year: 2025, month: 1 } });
  expect(current.state).toEqual({ status: 'loading', summary: null });
  await update({ selection: { year: 2025, month: 2 } });
  await act(async () => newer.resolve(summary(2)));
  await act(async () => older.reject(Error('obsolete failure')));
  expect(current.state).toEqual({ status: 'ready', summary: summary(2) });
  const first = deferred<CashSummary>();
  const second = deferred<CashSummary>();
  mockServices.transactions.summarize
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  await update({ selection: { year: 2025, month: 3 } });
  await update({ selection: { year: 2025, month: 4 } });
  await act(async () => second.resolve(summary(4)));
  await act(async () => first.resolve(summary(3)));
  expect(current.state.summary?.operationCount).toBe(4);
});
test('read failure remains error and explicit retry transitions through loading to ready', async () => {
  mockServices.transactions.summarize.mockRejectedValueOnce(
    Error('read failure'),
  );
  await mount();
  expect(current.state).toEqual({ status: 'error', summary: null });
  const retry = deferred<CashSummary>();
  mockServices.transactions.summarize.mockReturnValueOnce(retry.promise);
  let pending: Promise<void>;
  await act(async () => {
    pending = current.refresh();
  });
  expect(current.state).toEqual({ status: 'loading', summary: null });
  await act(async () => {
    retry.resolve(summary(1));
    await pending;
  });
  expect(current.state.summary?.operationCount).toBe(1);
});
test('committed notifications invalidate in-flight reads; preferences do not refresh', async () => {
  const older = deferred<CashSummary>();
  mockServices.transactions.summarize.mockReturnValueOnce(older.promise);
  await mount();
  await act(async () => mockServices.changes.notify('preferences'));
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(1);
  mockServices.transactions.summarize.mockResolvedValueOnce(summary(9));
  await act(async () => mockServices.changes.notify('transactions'));
  await act(async () => older.resolve(summary(1)));
  expect(current.state.summary?.operationCount).toBe(9);
});

test('a burst of commits and resume shares one read and rejects the pre-commit result', async () => {
  const older = deferred<CashSummary>();
  const latest = deferred<CashSummary>();
  mockServices.transactions.summarize
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(latest.promise);
  await mount();
  await act(async () => {
    for (let i = 0; i < 20; i++) {
      mockServices.changes.notify('transactions');
    }
    resume('active');
    older.resolve(summary(1));
  });
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(2);
  expect(current.state.summary).toBeNull();
  await act(async () => latest.resolve(summary(20)));
  expect(current.state.summary?.operationCount).toBe(20);
});
test('resume refreshes and unmount removes subscriptions and makes retained callbacks inert', async () => {
  await mount();
  await act(async () => resume('background'));
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(1);
  await act(async () => resume('active'));
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(2);
  const pending = deferred<CashSummary>();
  mockServices.transactions.summarize.mockReturnValueOnce(pending.promise);
  await act(async () => {
    current.refresh();
  });
  const retained = current.refresh;
  await act(async () => renderer.unmount());
  await act(async () => pending.resolve(summary(99)));
  await act(async () => {
    mockServices.changes.notify('transactions');
    await retained();
    resume('active');
  });
  expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(3);
  expect(removals.every(remove => remove.mock.calls.length === 1)).toBe(true);
});

test('same-query refresh preserves clearly stale data while loading/error, then clears on selection', async () => {
  mockServices.transactions.summarize.mockResolvedValueOnce(summary(7));
  await mount();
  const pending = deferred<CashSummary>();
  mockServices.transactions.summarize.mockReturnValueOnce(pending.promise);
  await act(async () => {
    current.refresh();
  });
  expect(current.state).toEqual({ status: 'loading', summary: null });
  expect(current.retainedSummary?.operationCount).toBe(7);
  expect(current.refreshing).toBe(true);
  await act(async () => pending.reject(Error('refresh failed')));
  expect(current.state).toEqual({ status: 'error', summary: null });
  expect(current.retainedSummary?.operationCount).toBe(7);
  expect(current.refreshError).toBe(true);
  expect(current.refreshing).toBe(false);
  const next = deferred<CashSummary>();
  mockServices.transactions.summarize.mockReturnValueOnce(next.promise);
  await update({ selection: { year: 2020, month: 1 } });
  expect(current.retainedSummary).toBeNull();
  expect(current.refreshError).toBe(false);
  await act(async () => next.resolve(summary(1)));
  expect(current.retainedSummary).toBeNull();
});

test('replacement service rejects the old service response and retained refresh callback', async () => {
  const original = mockServices;
  const pending = deferred<CashSummary>();
  original.transactions.summarize.mockReturnValueOnce(pending.promise);
  await mount();
  const oldRefresh = current.refresh;
  mockServices = {
    transactions: {
      summarize: jest
        .fn<Promise<CashSummary>, [PeriodBounds]>()
        .mockResolvedValue(summary(12)),
    },
    changes: createChangeNotifier(),
  };
  try {
    await update({});
    await act(async () => {
      pending.resolve(summary(1));
      await oldRefresh();
    });
    expect(current.state.summary?.operationCount).toBe(12);
    expect(original.transactions.summarize).toHaveBeenCalledTimes(1);
    expect(mockServices.transactions.summarize).toHaveBeenCalledTimes(1);
  } finally {
    mockServices = original;
  }
});
