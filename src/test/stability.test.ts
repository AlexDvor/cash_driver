import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';
import { getCalendarMonthBounds } from '../features/summary/periods';

test('burst of 200 payments with concurrent retries commits each ID once and keeps exact totals', async () => {
  const db = openTestDatabase();
  try {
    const { transactions, changes } = await testPersistence(db);
    let notifications = 0;
    const unsubscribe = changes.subscribe(() => notifications++);
    const pending = Array.from({ length: 200 }, () =>
      transactions.newPendingOperation(),
    );
    const results = await Promise.all(
      pending.flatMap(operation =>
        Array.from({ length: 3 }, () =>
          transactions.save(operation, validInput),
        ),
      ),
    );
    expect(new Set(results.map(record => record.id)).size).toBe(200);
    expect(await transactions.list()).toHaveLength(200);
    expect(notifications).toBe(200);
    const summary = await transactions.summarize(
      getCalendarMonthBounds({ year: 2026, month: 10 }, 'UTC'),
    );
    expect(summary).toMatchObject({
      operationCount: 200,
      fareTotalCents: 360000,
      tipTotalCents: 40000,
      netCashTotalCents: 400000,
    });
    await Promise.all(
      pending.map(operation => transactions.save(operation, validInput)),
    );
    expect(notifications).toBe(200);
    unsubscribe();
  } finally {
    db.close();
  }
});

test('50 queued rollbacks leave no partial writes and do not poison subsequent transactions', async () => {
  const db = openTestDatabase();
  try {
    const { transactions } = await testPersistence(db);
    const saved = await transactions.save(
      transactions.newPendingOperation(),
      validInput,
    );
    const failures = await Promise.allSettled(
      Array.from({ length: 50 }, () =>
        db.transaction(async tx => {
          await tx.execute('DELETE FROM transactions WHERE id = ?', [saved.id]);
          throw new Error('Injected transaction rollback');
        }),
      ),
    );
    expect(failures.every(result => result.status === 'rejected')).toBe(true);
    expect(await transactions.get(saved.id)).toEqual(saved);
    await transactions.save(transactions.newPendingOperation(), validInput);
    expect(await transactions.list()).toHaveLength(2);
    expect((await db.execute('PRAGMA integrity_check')).rows).toEqual([
      { integrity_check: 'ok' },
    ]);
  } finally {
    db.close();
  }
});
