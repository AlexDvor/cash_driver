import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { PersistenceProvider } from '../src/app/PersistenceProvider';
import { Persistence } from '../src/app/persistence';
import {
  DeletionProvider,
  useDeletion,
} from '../src/features/transactions/DeletionProvider';
import { DELETION_UNDO_SECONDS } from '../src/features/transactions/deletionConstants';
import { SqlConnection } from '../src/database/sqlite';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';
import { summarizeTransactions } from '../src/features/summary/summary';

let db: SqlConnection;
let services: Persistence;
let app: ReactTestRenderer.ReactTestRenderer;
let deletion: ReturnType<typeof useDeletion>;
let id: string;
let originalState: typeof AppState.currentState;
let onState: (state: AppStateStatus) => void;
let removeSubscription: jest.Mock;
test('stale confirmation callbacks cannot start single or all deletion after unmount', async () => {
  const old = deletion;
  const removeAll = jest.spyOn(services.transactions, 'removeAll');
  const remove = jest.spyOn(services.transactions, 'remove');
  await act(async () => app.unmount());
  old.begin(id);
  expect(await old.clearAll()).toBe(false);
  await act(async () => {
    jest.advanceTimersByTime(DELETION_UNDO_SECONDS * 1000);
  });
  expect(removeAll).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  expect(await services.transactions.get(id)).not.toBeNull();
});

function Probe() {
  deletion = useDeletion();
  return null;
}
async function mount() {
  await act(async () => {
    app = ReactTestRenderer.create(
      <PersistenceProvider initialize={async () => services}>
        <DeletionProvider>
          <Probe />
        </DeletionProvider>
      </PersistenceProvider>,
    );
  });
}
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-08T10:00:00Z'));
  originalState = AppState.currentState;
  AppState.currentState = 'active';
  removeSubscription = jest.fn();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_name, listener) => {
      onState = listener;
      return { remove: removeSubscription };
    });
  db = openTestDatabase();
  services = await testPersistence(db);
  const saved = await services.transactions.save(
    services.transactions.newPendingOperation(),
    {
      platform: 'uber',
      fareAmountCents: 1800,
      cashReceivedCents: 2000,
      changeAsTip: true,
    },
  );
  id = saved.id;
  await mount();
});
afterEach(async () => {
  await act(async () => app.unmount());
  db.close();
  AppState.currentState = originalState;
  jest.restoreAllMocks();
  jest.useRealTimers();
});
async function advance(ms = DELETION_UNDO_SECONDS * 1000) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

test('undo leaves the exact original row and totals, without writes or notifications', async () => {
  const before = await services.transactions.get(id);
  const remove = jest.spyOn(services.transactions, 'remove');
  const notify = jest.spyOn(services.changes, 'notify');
  await act(async () => deletion.begin(id));
  expect(deletion.state.status).toBe('pending');
  expect(await services.transactions.get(id)).toEqual(before);
  await act(async () => deletion.undo());
  await advance();
  expect(remove).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalled();
  expect(await services.transactions.get(id)).toEqual(before);
  expect(
    summarizeTransactions(await services.transactions.list()).netCashTotalCents,
  ).toBe(2000);
});
test('one pending deletion only, expiry commits once and notifies once', async () => {
  const remove = jest.spyOn(services.transactions, 'remove');
  const notify = jest.spyOn(services.changes, 'notify');
  await act(async () => {
    deletion.begin(id);
    deletion.begin('other');
  });
  expect(deletion.state.id).toBe(id);
  await advance();
  await advance();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledTimes(1);
  expect(await services.transactions.get(id)).toBeNull();
});
test('background before expiry cancels and does not resume on active or remount', async () => {
  await act(async () => deletion.begin(id));
  await advance(9999);
  await act(async () => {
    AppState.currentState = 'background';
    onState('background');
  });
  await advance();
  await act(async () => {
    AppState.currentState = 'active';
    onState('active');
  });
  await act(async () => app.unmount());
  await mount();
  await advance();
  expect(deletion.state.status).toBe('idle');
  expect(await services.transactions.get(id)).not.toBeNull();
});
test('undo wins before expiry; expiry wins once the write starts and undo is unavailable', async () => {
  await act(async () => deletion.begin(id));
  await advance(9999);
  await act(async () => deletion.undo());
  await advance(1);
  expect(await services.transactions.get(id)).not.toBeNull();
  const original = services.transactions.remove;
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  jest.spyOn(services.transactions, 'remove').mockImplementation(async key => {
    await gate;
    return original(key);
  });
  await act(async () => deletion.begin(id));
  await advance();
  expect(deletion.state.status).toBe('writing');
  await act(async () => deletion.undo());
  expect(deletion.state.status).toBe('writing');
  await act(async () => {
    release();
    await gate;
  });
  expect(await services.transactions.get(id)).toBeNull();
});
test('actual failed DELETE rolls back, preserves totals and notifications; retry writes once', async () => {
  const execute = db.execute;
  await execute(
    "CREATE TRIGGER reject_delete BEFORE DELETE ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  const notify = jest.spyOn(services.changes, 'notify');
  await act(async () => deletion.begin(id));
  await advance();
  expect(deletion.state.status).toBe('error');
  expect(await services.transactions.get(id)).not.toBeNull();
  expect(
    summarizeTransactions(await services.transactions.list()).netCashTotalCents,
  ).toBe(2000);
  expect(notify).not.toHaveBeenCalled();
  await execute('DROP TRIGGER reject_delete');
  await act(async () => {
    deletion.retry();
    deletion.retry();
  });
  expect(await services.transactions.get(id)).toBeNull();
  expect(notify).toHaveBeenCalledTimes(1);
});
test('unmount cancels the in-memory timer without deleting a record', async () => {
  await act(async () => deletion.begin(id));
  await act(async () => app.unmount());
  expect(removeSubscription).toHaveBeenCalledTimes(1);
  await advance();
  expect(await services.transactions.get(id)).not.toBeNull();
});

test('undo and expiry at the exact same deadline have one result in either callback order', async () => {
  const remove = jest.spyOn(services.transactions, 'remove');
  setTimeout(() => deletion.undo(), DELETION_UNDO_SECONDS * 1000);
  await act(async () => deletion.begin(id));
  await advance();
  expect(remove).not.toHaveBeenCalled();
  expect(await services.transactions.get(id)).not.toBeNull();
  await act(async () => deletion.begin(id));
  setTimeout(() => deletion.undo(), DELETION_UNDO_SECONDS * 1000);
  await advance();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(await services.transactions.get(id)).toBeNull();
});
