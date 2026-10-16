import { SqlConnection, SqlExecutor, SqlValue } from '../database/sqlite';
import { createTransactionRepository } from '../features/transactions/transactionRepository';
import { getCalendarMonthBounds } from '../features/summary/periods';
import { summarizeTransactions } from '../features/summary/summary';
import {
  calendarVolumeRows,
  CALENDAR_FIXTURE_COUNT,
} from './calendarVolumeFixture';

function check(condition: boolean, label: string) {
  if (!condition) {
    throw Error(`Calendar acceptance: ${label}`);
  }
}

export async function verifyCalendarVolume(db: SqlConnection) {
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
  const repository = createTransactionRepository(observed);
  const bounds = getCalendarMonthBounds({ year: 2026, month: 10 }, 'UTC');
  const expected = [...calendarVolumeRows()].filter(
    row =>
      row.createdAt >= bounds.start.toISOString() &&
      row.createdAt < bounds.end.toISOString(),
  );
  const firstStart = performance.now();
  let page = await repository.listPage({ bounds });
  const preflightAndFirstPageMs = performance.now() - firstStart;
  const seen = new Set<string>();
  const ordered: string[] = [];
  const pagesStart = performance.now();
  while (true) {
    check(page.records.length <= 50, 'page bound');
    for (const row of page.records) {
      check(!seen.has(row.id), 'duplicate cursor ID');
      seen.add(row.id);
      ordered.push(row.id);
    }
    if (!page.nextCursor) {
      break;
    }
    page = await repository.listPage({ bounds, cursor: page.nextCursor });
  }
  const remainingPagesMs = performance.now() - pagesStart;
  check(seen.size === expected.length, 'all dense month rows');
  const expectedOrder = [...expected]
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    )
    .map(row => row.id);
  check(
    JSON.stringify(ordered) === JSON.stringify(expectedOrder),
    'timestamp tie ordering',
  );
  const summaryStart = performance.now();
  const summary = await repository.summarize(bounds);
  const summaryMs = performance.now() - summaryStart;
  check(
    JSON.stringify(summary) === JSON.stringify(summarizeTransactions(expected)),
    'exact dense summary',
  );
  const activityStart = performance.now();
  const dates = await repository.occupiedDates(
    { year: 2026, month: 10 },
    'Europe/Madrid',
  );
  const activityMs = performance.now() - activityStart;
  check(
    JSON.stringify(dates) === JSON.stringify(['2026-10-08', '2026-10-25']),
    'local DST activity',
  );
  check(
    (await repository.occupiedDates({ year: 2025, month: 2 }, 'UTC')).length ===
      4,
    'sparse month',
  );
  check(
    (
      await repository.listPage({
        bounds: getCalendarMonthBounds({ year: 2019, month: 1 }, 'UTC'),
      })
    ).records.length === 0,
    'empty historical month',
  );
  await repository.listPage({ bounds, platform: 'uber' });
  const pageReads = reads.filter(read => read.sql.startsWith('SELECT *'));
  const aggregateReads = reads.filter(read =>
    read.sql.includes('GROUP BY platform'),
  );
  check(
    pageReads.every(read => read.rows <= 51),
    'bounded database transfer',
  );
  check(
    aggregateReads.every(read => read.rows <= 4),
    'four platform aggregates',
  );
  const plans = [];
  for (const read of [
    pageReads[0],
    pageReads[1],
    pageReads[pageReads.length - 1],
    aggregateReads[0],
  ]) {
    plans.push(
      (
        await db.execute(`EXPLAIN QUERY PLAN ${read.sql}`, read.params)
      ).rows.map(row => row.detail),
    );
  }
  check(
    plans[0].some(detail =>
      String(detail).includes('transactions_created_at_idx'),
    ),
    'range index',
  );
  check(
    plans[2].some(detail =>
      String(detail).includes('transactions_platform_created_at_idx'),
    ),
    'platform index',
  );
  const count = (await db.execute('SELECT COUNT(*) AS total FROM transactions'))
    .rows[0].total;
  check(count === CALENDAR_FIXTURE_COUNT, 'fixture row count');
  return {
    totalRecords: count,
    selectedRecords: expected.length,
    preflightAndFirstPageMs,
    remainingPagesMs,
    summaryMs,
    activityMs,
    maxPageTransfer: Math.max(...pageReads.map(read => read.rows)),
    summary,
    dates,
    plans,
  };
}
