import { SqlConnection } from '../database/sqlite';
import { createTransactionRepository } from '../features/transactions/transactionRepository';
import { CashSummary } from '../features/summary/summary';
import {
  getCalendarDayBounds,
  getCalendarMonthBounds,
  getPeriodBounds,
  PeriodBounds,
} from '../features/summary/periods';
import { VolumeFixtureOptions, volumeRows } from './threeYearFixture';

function check(value: boolean, message: string): asserts value {
  if (!value) throw new Error(`Volume acceptance: ${message}`);
}

// Independent streaming oracle; does not use production aggregation utilities.
export function expectedVolume(
  options: VolumeFixtureOptions,
  bounds: PeriodBounds,
) {
  const expected: CashSummary = {
    operationCount: 0,
    fareTotalCents: 0,
    tipTotalCents: 0,
    netCashTotalCents: 0,
    averageFareCents: 0,
    fareByPlatformCents: { uber: 0, cabify: 0, bolt: 0, other: 0 },
  };
  const records = [];
  const start = bounds.start.toISOString();
  const end = bounds.end.toISOString();
  for (const row of volumeRows(options)) {
    if (row.createdAt < start || row.createdAt >= end) continue;
    records.push(row);
    expected.operationCount++;
    expected.fareTotalCents += row.fareAmountCents;
    expected.tipTotalCents += row.tipCents;
    expected.netCashTotalCents += row.netCashCents;
    expected.fareByPlatformCents[row.platform] += row.fareAmountCents;
  }
  expected.averageFareCents = expected.operationCount
    ? Math.round(expected.fareTotalCents / expected.operationCount)
    : 0;
  records.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
  return { expected, records };
}

export async function verifyThreeYearVolume(
  db: SqlConnection,
  options: VolumeFixtureOptions,
) {
  const repository = createTransactionRepository(db);
  const dateFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const months = [
    { year: 2023, month: 10 },
    { year: 2024, month: 2 },
    { year: 2026, month: 3 },
    { year: 2026, month: 10 },
  ];
  for (const month of months) {
    const bounds = getCalendarMonthBounds(month, 'Europe/Madrid');
    const { expected, records } = expectedVolume(options, bounds);
    const actual = await repository.summarize(bounds);
    check(
      JSON.stringify(actual) === JSON.stringify(expected),
      `summary ${month.year}-${month.month}`,
    );
    const ids: string[] = [];
    let page = await repository.listPage({ bounds });
    while (true) {
      check(page.records.length <= 50, 'bounded page');
      ids.push(...page.records.map(row => row.id));
      if (!page.nextCursor) break;
      page = await repository.listPage({ bounds, cursor: page.nextCursor });
    }
    check(
      JSON.stringify(ids) === JSON.stringify(records.map(row => row.id)),
      'complete ordered pagination',
    );
    for (const platform of ['uber', 'cabify', 'bolt', 'other'] as const) {
      const filtered = await repository.listPage({ bounds, platform });
      check(
        JSON.stringify(filtered.records.map(row => row.id)) ===
          JSON.stringify(
            records
              .filter(row => row.platform === platform)
              .slice(0, 50)
              .map(row => row.id),
          ),
        `platform ${platform}`,
      );
    }
    const dates = [
      ...new Set(
        records.map(row => dateFormat.format(new Date(row.createdAt))),
      ),
    ].sort();
    check(
      JSON.stringify(await repository.occupiedDates(month, 'Europe/Madrid')) ===
        JSON.stringify(dates),
      'calendar activity',
    );
  }
  const ranges = [
    getCalendarDayBounds({ year: 2026, month: 10, day: 27 }, 'Europe/Madrid'),
    getPeriodBounds(new Date('2026-10-27T12:00:00Z'), 'week', 'Europe/Madrid'),
    getCalendarMonthBounds({ year: 2026, month: 10 }, 'Europe/Madrid'),
  ];
  for (const bounds of ranges) {
    check(
      JSON.stringify(await repository.summarize(bounds)) ===
        JSON.stringify(expectedVolume(options, bounds).expected),
      'day/week/month totals',
    );
  }
  const samples = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    const fresh = createTransactionRepository(db);
    const page = await fresh.listPage({ bounds: ranges[2] });
    const firstPageMs = performance.now() - start;
    const summaryStart = performance.now();
    await fresh.summarizeCompatible(ranges[0]);
    const homeSummaryMs = performance.now() - summaryStart;
    const periodStart = performance.now();
    for (const bounds of ranges) await fresh.summarize(bounds);
    const summariesMs = performance.now() - periodStart;
    const calendarStart = performance.now();
    await fresh.occupiedDates(months[3], 'Europe/Madrid');
    samples.push({
      firstPageMs,
      summariesMs,
      homeSummaryMs,
      calendarMs: performance.now() - calendarStart,
      pageRows: page.records.length,
    });
  }
  const integrity = await db.execute('PRAGMA integrity_check');
  check(integrity.rows[0]?.integrity_check === 'ok', 'integrity');
  const pages = await db.execute('PRAGMA page_count');
  const size = await db.execute('PRAGMA page_size');
  const count = await db.execute('SELECT COUNT(*) AS count FROM transactions');
  check(count.rows[0]?.count === options.count, 'exact fixture count');
  const plan = await db.execute(
    'EXPLAIN QUERY PLAN SELECT id FROM transactions WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC, id DESC LIMIT 51',
    [ranges[2].start.toISOString(), ranges[2].end.toISOString()],
  );
  check(
    plan.rows.some(row => String(row.detail).includes('INDEX')),
    'indexed range',
  );
  return {
    count: options.count,
    databaseBytes:
      Number(pages.rows[0].page_count) * Number(size.rows[0].page_size),
    samples,
    queryPlan: plan.rows,
  };
}
