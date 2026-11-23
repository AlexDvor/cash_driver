import { buildBackup, parseBackup } from './exportData';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from '../../test/sqliteTestDatabase';
import { CashTransaction } from '../transactions/types';

function record(n: number, overrides: Partial<CashTransaction> = {}) {
  return {
    id: `bbbbbbbb-0000-4000-8000-${String(n).padStart(12, '0')}`,
    platform: 'uber',
    fareAmountCents: 1850,
    cashReceivedCents: 2000,
    changeGivenCents: 100,
    tipCents: 50,
    netCashCents: 1900,
    createdAt: `2026-10-0${n}T08:00:00.000Z`,
    updatedAt: null,
    ...overrides,
  } as CashTransaction;
}

async function freshServices() {
  return testPersistence(openTestDatabase());
}

test('imports missing operations keeping their ids and timestamps', async () => {
  const services = await freshServices();
  const result = await services.transactions.importRecords([
    record(1),
    record(2, { updatedAt: '2026-10-03T09:00:00.000Z' }),
  ]);
  expect(result).toEqual({ inserted: 2, skipped: 0, conflicts: 0 });
  const stored = await services.transactions.list();
  expect(stored.map(r => r.id).sort()).toEqual([record(1).id, record(2).id]);
  expect(stored.find(r => r.id === record(2).id)?.updatedAt).toBe(
    '2026-10-03T09:00:00.000Z',
  );
  expect(stored.find(r => r.id === record(1).id)?.createdAt).toBe(
    '2026-10-01T08:00:00.000Z',
  );
});

test('importing the same backup twice adds nothing the second time', async () => {
  const services = await freshServices();
  await services.transactions.importRecords([record(1), record(2)]);
  const again = await services.transactions.importRecords([
    record(1),
    record(2),
    record(3),
  ]);
  expect(again).toEqual({ inserted: 1, skipped: 2, conflicts: 0 });
  expect(await services.transactions.list()).toHaveLength(3);
});

test('never overwrites an existing operation with different amounts', async () => {
  const services = await freshServices();
  await services.transactions.importRecords([record(1)]);
  const result = await services.transactions.importRecords([
    record(1, {
      fareAmountCents: 999,
      cashReceivedCents: 1000,
      changeGivenCents: 1,
      tipCents: 0,
      netCashCents: 999,
    }),
    record(2),
  ]);
  expect(result).toEqual({ inserted: 1, skipped: 0, conflicts: 1 });
  const kept = await services.transactions.get(record(1).id);
  expect(kept?.fareAmountCents).toBe(1850);
});

test('notifies listeners only when something was added', async () => {
  const services = await freshServices();
  const listener = jest.fn();
  services.changes.subscribe(listener);
  await services.transactions.importRecords([record(1)]);
  expect(listener).toHaveBeenCalledTimes(1);
  await services.transactions.importRecords([record(1)]);
  expect(listener).toHaveBeenCalledTimes(1);
});

test('a backup of one database restores into an empty one unchanged', async () => {
  const source = await freshServices();
  const pending = source.transactions.newPendingOperation();
  await source.transactions.save(pending, validInput);
  await source.transactions.importRecords([record(1), record(2)]);
  const original = await source.transactions.list();

  const text = buildBackup(original, new Date('2026-10-09T10:00:00Z'));
  const parsed = parseBackup(text);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) {
    return;
  }
  const target = await freshServices();
  const result = await target.transactions.importRecords(parsed.records);
  expect(result).toEqual({ inserted: 3, skipped: 0, conflicts: 0 });
  const restored = await target.transactions.list();
  expect(restored).toEqual(original);
});
