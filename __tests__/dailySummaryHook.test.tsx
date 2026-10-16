import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { useDailySummary } from '../src/hooks/summary/useDailySummary';
import { createChangeNotifier } from '../src/app/changeNotifier';
import type { CashTransaction } from '../src/features/transactions/types';

jest.mock('../src/providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistence: () => ({ services: mockServices }),
}));

function services() {
  return {
    transactions: { list: jest.fn<Promise<CashTransaction[]>, []>() },
    changes: createChangeNotifier(),
  };
}
let mockServices = services();
let current: ReturnType<typeof useDailySummary>;
let app: Renderer.ReactTestRenderer;
let resume: (state: AppStateStatus) => void;
let removals: jest.Mock[];
type Props = { now?: string; timeZone?: string };
function Probe({ now = '2026-10-14T12:00:00Z', timeZone = 'UTC' }: Props) {
  current = useDailySummary({
    now: new Date(now),
    dayKey: now.slice(0, 10),
    timeZone,
  });
  return null;
}
function record(
  id = 'one',
  createdAt = '2026-10-14T10:00:00.000Z',
): CashTransaction {
  return {
    id,
    createdAt,
    updatedAt: null,
    platform: 'uber',
    fareAmountCents: 100,
    cashReceivedCents: 100,
    changeGivenCents: 0,
    tipCents: 0,
    netCashCents: 100,
  };
}
function deferred() {
  let resolve!: (rows: CashTransaction[]) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<CashTransaction[]>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function mount() {
  await act(async () => {
    app = Renderer.create(<Probe />);
  });
}
beforeEach(() => {
  mockServices = services();
  mockServices.transactions.list.mockResolvedValue([record()]);
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
  await act(async () => app?.unmount());
  jest.restoreAllMocks();
});

test('same-day refresh retains totals through error and retry, then publishes genuine zero', async () => {
  await mount();
  const pending = deferred();
  mockServices.transactions.list.mockReturnValueOnce(pending.promise);
  await act(async () => {
    current.refresh();
  });
  expect(current.refreshing).toBe(true);
  expect(current.retainedSummary?.fareTotalCents).toBe(100);
  await act(async () => pending.reject(Error('read failure')));
  expect(current.refreshError).toBe(true);
  expect(current.retainedSummary?.fareTotalCents).toBe(100);
  const retry = deferred();
  mockServices.transactions.list.mockReturnValueOnce(retry.promise);
  await act(async () => {
    current.refresh();
  });
  expect(current.refreshError).toBe(false);
  expect(current.retainedSummary?.fareTotalCents).toBe(100);
  await act(async () => retry.resolve([]));
  expect(current.state.summary?.fareTotalCents).toBe(0);
  expect(current.retainedSummary).toBeNull();
});

test.each(['day', 'timezone', 'service'] as const)(
  '%s change hides previous totals and makes old refresh callbacks inert',
  async change => {
    await mount();
    const oldServices = mockServices;
    const oldRefresh = current.refresh;
    const pending = deferred();
    mockServices.transactions.list.mockReturnValueOnce(pending.promise);
    await act(async () => {
      current.refresh();
    });
    const next = deferred();
    if (change === 'service') mockServices = services();
    mockServices.transactions.list.mockReturnValueOnce(next.promise);
    const props =
      change === 'day'
        ? { now: '2026-10-15T12:00:00Z' }
        : change === 'timezone'
        ? { timeZone: 'Europe/Madrid' }
        : {};
    await act(async () => app.update(<Probe {...props} />));
    expect(current.state.status).toBe('loading');
    expect(current.retainedSummary).toBeNull();
    const beforeOldCallback = oldServices.transactions.list.mock.calls.length;
    await act(async () => {
      await oldRefresh();
      pending.resolve([record()]);
    });
    expect(oldServices.transactions.list).toHaveBeenCalledTimes(
      beforeOldCallback,
    );
    expect(current.state.status).toBe('loading');
    await act(async () => next.resolve([]));
    expect(current.state.summary?.operationCount).toBe(0);
  },
);

test('commit/resume burst invalidates older response synchronously and shares one read', async () => {
  const old = deferred();
  mockServices.transactions.list.mockReturnValueOnce(old.promise);
  await mount();
  const next = deferred();
  mockServices.transactions.list.mockReturnValueOnce(next.promise);
  await act(async () => {
    for (let i = 0; i < 5; i++) mockServices.changes.notify('transactions');
    resume('active');
    old.resolve([record()]);
  });
  expect(mockServices.transactions.list).toHaveBeenCalledTimes(2);
  expect(current.state.summary).toBeNull();
  await act(async () => next.resolve([]));
  expect(current.state.summary?.operationCount).toBe(0);
});

test('ticks/preferences do not reread; unmount cancels queued refresh and old callbacks', async () => {
  await mount();
  await act(async () => {
    app.update(<Probe now="2026-10-14T12:00:01Z" />);
    mockServices.changes.notify('preferences');
  });
  expect(mockServices.transactions.list).toHaveBeenCalledTimes(1);
  const refresh = current.refresh;
  act(() => {
    mockServices.changes.notify('transactions');
    app.unmount();
  });
  await act(async () => {
    await refresh();
    resume('active');
  });
  expect(mockServices.transactions.list).toHaveBeenCalledTimes(1);
  expect(removals.every(remove => remove.mock.calls.length === 1)).toBe(true);
});
