import { performance } from 'node:perf_hooks';
import { SqlConnection, SqlExecutor, SqlValue } from '../src/database/sqlite';
import { migrateDatabase } from '../src/database/migrations';
import { createTransactionRepository } from '../src/features/transactions/transactionRepository';
import { getCalendarMonthBounds } from '../src/features/summary/periods';
import { openTestDatabase } from './sqliteTestDatabase';

test('isolated multiyear volume fixture keeps transfer bounded and records actual indexed query plans', async () => {
  const db = openTestDatabase();
  const reads: { sql: string; params?: SqlValue[]; rows: number }[] = [];
  const observed: SqlConnection = {
    ...db,
    transaction: work =>
      db.transaction(tx => {
        const executor: SqlExecutor = {
          execute: async (sql, params) => {
            const result = await tx.execute(sql, params);
            reads.push({ sql, params, rows: result.rows.length });
            return result;
          },
        };
        return work(executor);
      }),
  };
  try {
    await migrateDatabase(db);
    await db.transaction(async tx => {
      for (let i = 0; i < 10000; i++) {
        const year = i < 9000 ? 2020 + (i % 6) : 2026;
        const timestamp = `${year}-10-08T10:00:00.000Z`;
        await tx.execute(
          `INSERT INTO transactions VALUES (?, ?, 100, 101, 0, 1, 101, ?, NULL)`,
          [String(i).padStart(12, '0'), i % 2 ? 'bolt' : 'uber', timestamp],
        );
      }
    });
    const repository = createTransactionRepository(observed);
    const bounds = getCalendarMonthBounds({ year: 2026, month: 10 }, 'UTC');
    const beforePreflight = performance.now();
    await repository.listPage({ bounds });
    const preflightAndPageMs = performance.now() - beforePreflight;
    reads.length = 0;
    const pageSamples = [];
    for (const pageSize of [10, 25, 50]) {
      const start = performance.now();
      const page = await repository.listPage({ bounds, pageSize });
      expect(page.records).toHaveLength(pageSize);
      pageSamples.push({ pageSize, elapsedMs: performance.now() - start });
    }
    const start = performance.now();
    const summary = await repository.summarize(bounds);
    const summaryMs = performance.now() - start;
    expect(summary.operationCount).toBe(1000);
    expect(summary.netCashTotalCents).toBe(101000);
    const activityStart = performance.now();
    expect(
      await repository.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
    ).toEqual(['2026-10-08']);
    const activityMs = performance.now() - activityStart;
    await repository.listPage({ bounds, platform: 'uber' });
    const pageReads = reads.filter(read =>
      read.sql.includes('SELECT * FROM transactions WHERE'),
    );
    expect(pageReads.every(read => read.rows <= 51)).toBe(true);
    const aggregateReads = reads.filter(read =>
      read.sql.includes('GROUP BY platform'),
    );
    expect(aggregateReads.every(read => read.rows <= 4)).toBe(true);
    const activityReads = reads.filter(
      read =>
        read.sql.includes('COUNT(*) AS operation_count') &&
        !read.sql.includes('GROUP BY'),
    );
    expect(activityReads).toHaveLength(31);
    expect(activityReads.every(read => read.rows === 1)).toBe(true);
    const unfiltered = pageReads[2];
    const platformFiltered = pageReads[3];
    const plans = [];
    for (const read of [
      unfiltered,
      platformFiltered,
      aggregateReads[0],
      activityReads[0],
    ]) {
      const result = await db.execute(
        `EXPLAIN QUERY PLAN ${read.sql}`,
        read.params,
      );
      plans.push(result.rows.map(row => row.detail));
    }
    expect(
      plans[0].some(detail =>
        String(detail).includes('transactions_created_at_idx'),
      ),
    ).toBe(true);
    expect(
      plans[1].some(detail =>
        String(detail).includes('transactions_platform_created_at_idx'),
      ),
    ).toBe(true);
    console.info(
      'Bounded-read observations (synthetic Node SQLite, not native SLO)',
      JSON.stringify({
        totalRecords: 10000,
        selectedRecords: 1000,
        preflightAndPageMs,
        pageSamples,
        summaryMs,
        activityMs,
        plans,
      }),
    );
  } finally {
    db.close();
  }
});
