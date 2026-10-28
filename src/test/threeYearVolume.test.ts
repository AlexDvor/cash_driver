import { openTestDatabase } from './sqliteTestDatabase';
import { migrateDatabase } from '../database/migrations';
import {
  seedVolumeFixture,
  threeYearFixture,
  volumeRows,
} from './threeYearFixture';
import { verifyThreeYearVolume } from './threeYearChecks';
import { createTransactionRepository } from '../features/transactions/transactionRepository';
import { summarizeTransactions } from '../features/summary/summary';
import { getCalendarDayBounds } from '../features/summary/periods';
import { SqlConnection, SqlExecutor } from '../database/sqlite';
import { verifyLegacyMigrations } from './legacyMigrationChecks';

test('three-year deterministic fixture covers 109600 valid payments, indexed reads and exact summaries', async () => {
  const db = openTestDatabase();
  try {
    await migrateDatabase(db);
    await seedVolumeFixture(db, threeYearFixture);
    const report = await verifyThreeYearVolume(db, threeYearFixture);
    expect(report.count).toBe(109600);
    expect(report.samples).toHaveLength(10);
    expect(report.samples.every(sample => sample.pageRows <= 50)).toBe(true);
    console.info('THREE_YEAR_NODE_OBSERVATIONS', JSON.stringify(report));
  } finally {
    db.close();
  }
}, 120000);

test('daily summary uses compact SQL and preserves legacy timestamp and corruption behavior with bounded fallback', async () => {
  const db = openTestDatabase();
  let maxRows = 0;
  const observe = (executor: SqlExecutor): SqlExecutor => ({
    execute: async (sql, params) => {
      const result = await executor.execute(sql, params);
      maxRows = Math.max(maxRows, result.rows.length);
      return result;
    },
  });
  const observed: SqlConnection = {
    ...db,
    ...observe(db),
    transaction: work => db.transaction(tx => work(observe(tx))),
  };
  try {
    await migrateDatabase(db);
    await seedVolumeFixture(db, {
      ...threeYearFixture,
      startDate: '2026-10-27',
      endDate: '2026-10-27',
      count: 151,
    });
    const repository = createTransactionRepository(observed);
    const bounds = getCalendarDayBounds(
      { year: 2026, month: 10, day: 27 },
      'Europe/Madrid',
    );
    await expect(
      repository.summarizeCompatible({ start: new Date(NaN), end: bounds.end }),
    ).rejects.toThrow();
    await expect(
      repository.summarizeCompatible({ start: bounds.end, end: bounds.start }),
    ).rejects.toThrow();
    const expected = summarizeTransactions(
      await createTransactionRepository(db).list(),
    );
    expect(await repository.summarizeCompatible(bounds)).toEqual(expected);
    expect(maxRows).toBeLessThanOrEqual(4);
    await db.execute(
      "UPDATE transactions SET created_at = '2026-10-27T00:00:00+01:00' WHERE id = '30000000-0000-4000-8000-000000000000'",
    );
    maxRows = 0;
    expect(await repository.summarizeCompatible(bounds)).toEqual(expected);
    expect(maxRows).toBe(50);
    await expect(
      repository.summarizeCompatible({ start: new Date(NaN), end: bounds.end }),
    ).rejects.toThrow();
    await expect(
      repository.summarizeCompatible({ start: bounds.end, end: bounds.start }),
    ).rejects.toThrow();
    await db.execute(
      "UPDATE transactions SET created_at = '2020-01-01T00:00:00Z', updated_at = 'broken' WHERE id = '30000000-0000-4000-8000-000000000000'",
    );
    await expect(repository.summarizeCompatible(bounds)).rejects.toThrow(
      'Corrupt',
    );
  } finally {
    db.close();
  }
});

test('fixture is reproducible, rejects invalid input and yields exact small/empty datasets', () => {
  const options = { ...threeYearFixture, count: 100 };
  expect([...volumeRows(options)]).toEqual([...volumeRows(options)]);
  expect([...volumeRows(options)]).toHaveLength(100);
  expect([...volumeRows({ ...options, count: 0 })]).toHaveLength(0);
  expect(() => [...volumeRows({ ...options, count: -1 })]).toThrow();
});

test('fixture explicitly covers both repeated-hour instants and spring transition boundaries', () => {
  const times = new Set(
    [...volumeRows(threeYearFixture)].map(row => row.createdAt),
  );
  for (const time of [
    '2026-10-25T00:30:00.000Z',
    '2026-10-25T01:30:00.000Z',
    '2026-03-29T00:59:59.999Z',
    '2026-03-29T01:00:00.000Z',
  ])
    expect(times.has(time)).toBe(true);
});

test('historical synthetic schemas migrate and roll back without losing payments', async () => {
  expect(await verifyLegacyMigrations(() => openTestDatabase())).toEqual([
    1, 3, 4, 5, 6,
  ]);
});
