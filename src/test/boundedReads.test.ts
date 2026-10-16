import { SqlConnection, SqlExecutor } from '../database/sqlite';
import {
  getCalendarDayBounds,
  getCalendarMonthBounds,
} from '../features/summary/periods';
import { summarizeTransactions } from '../features/summary/summary';
import { Platform } from '../features/transactions/types';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';

let db: SqlConnection;
beforeEach(() => {
  db = openTestDatabase();
});
afterEach(() => db.close());
const october = getCalendarMonthBounds({ year: 2026, month: 10 }, 'UTC');

async function fixture(connection = db) {
  let clock = new Date('2026-10-08T10:00:00.000Z');
  const services = await testPersistence(connection, () => clock);
  let sequence = 0;
  async function save(
    date: string,
    platform: Platform = 'uber',
    fare = 100,
    tip = 0,
  ) {
    clock = new Date(date);
    sequence++;
    return services.transactions.save(
      { id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}` },
      {
        platform,
        fareAmountCents: fare,
        cashReceivedCents: fare + tip,
        tipCents: tip,
      },
    );
  }
  return { ...services, save };
}

test('keyset pages preserve tied timestamps without duplicates or missing records and enforce query identity', async () => {
  const f = await fixture();
  const expected = [];
  for (let i = 0; i < 107; i++) {
    expected.push(
      await f.save('2026-10-08T10:00:00.000Z', i % 2 ? 'bolt' : 'uber'),
    );
  }
  await f.save('2026-11-01T00:00:00.000Z');
  const first = await f.transactions.listPage({
    bounds: october,
    platform: 'uber',
    pageSize: 17,
  });
  expect(first.records).toHaveLength(17);
  await expect(
    f.transactions.listPage({
      bounds: october,
      platform: 'bolt',
      cursor: first.nextCursor!,
    }),
  ).rejects.toThrow('cursor');
  await expect(
    f.transactions.listPage({ cursor: first.nextCursor! }),
  ).rejects.toThrow('cursor');
  const all = [...first.records];
  let cursor = first.nextCursor;
  while (cursor) {
    const page = await f.transactions.listPage({
      bounds: october,
      platform: 'uber',
      pageSize: 17,
      cursor,
    });
    all.push(...page.records);
    cursor = page.nextCursor;
  }
  expect(all).toEqual(
    expected.filter(row => row.platform === 'uber').reverse(),
  );
  expect(new Set(all.map(row => row.id)).size).toBe(all.length);
  for (const pageSize of [0, -1, 51, 1.5]) {
    await expect(f.transactions.listPage({ pageSize })).rejects.toThrow();
  }
});

test('committed insert, edit and deletion invalidate existing cursors and refresh aggregates/activity', async () => {
  const f = await fixture();
  const row = await f.save('2026-10-08T10:00:00.000Z');
  await f.save('2026-10-07T10:00:00.000Z');
  for (const mutate of [
    () => f.save('2026-10-09T10:00:00.000Z'),
    () => f.transactions.edit(row.id, { ...validInput, platform: 'bolt' }),
    () => f.transactions.remove(row.id),
  ]) {
    const page = await f.transactions.listPage({ pageSize: 1 });
    await mutate();
    await expect(
      f.transactions.listPage({ cursor: page.nextCursor! }),
    ).rejects.toThrow('cursor');
    expect(await f.transactions.summarize(october)).toEqual(
      summarizeTransactions(await f.transactions.list()),
    );
  }
  expect(
    await f.transactions.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
  ).toEqual(['2026-10-07', '2026-10-09']);
  await f.transactions.removeAll();
  expect(await f.transactions.hasAny()).toBe(false);
  expect(await f.transactions.listPage()).toEqual({
    records: [],
    nextCursor: null,
  });
  expect((await f.transactions.summarize(october)).operationCount).toBe(0);
});

test('half-open local DST bounds and zero-tip operations mark every platform and match exact rounded summaries', async () => {
  const f = await fixture();
  const day = getCalendarDayBounds(
    { year: 2026, month: 3, day: 29 },
    'Europe/Madrid',
  );
  await f.save(new Date(day.start.getTime() - 1).toISOString());
  const rows = [];
  for (const [i, platform] of (
    ['uber', 'cabify', 'bolt', 'other'] as const
  ).entries()) {
    rows.push(
      await f.save(
        new Date(day.start.getTime() + i).toISOString(),
        platform,
        100 + i,
      ),
    );
  }
  await f.save(day.end.toISOString());
  expect((await f.transactions.listPage({ bounds: day })).records).toEqual(
    [...rows].reverse(),
  );
  const summary = await f.transactions.summarize(day);
  expect(summary).toEqual(summarizeTransactions(rows));
  expect(summary.averageFareCents).toBe(102);
  expect(summary.tipTotalCents).toBe(0);
  expect(
    await f.transactions.occupiedDates(
      { year: 2026, month: 3 },
      'Europe/Madrid',
    ),
  ).toEqual(['2026-03-28', '2026-03-29', '2026-03-30']);
  expect(await f.transactions.hasAny()).toBe(true);
  expect(await f.transactions.get(rows[0].id)).toEqual(rows[0]);
});

test('a skipped Apia date is empty and never inherits the next day activity', async () => {
  const f = await fixture();
  await f.save('2011-12-30T10:00:00.000Z');
  const skipped = getCalendarDayBounds(
    { year: 2011, month: 12, day: 30 },
    'Pacific/Apia',
  );
  expect((await f.transactions.summarize(skipped)).operationCount).toBe(0);
  expect((await f.transactions.listPage({ bounds: skipped })).records).toEqual(
    [],
  );
  expect(
    await f.transactions.occupiedDates(
      { year: 2011, month: 12 },
      'Pacific/Apia',
    ),
  ).toEqual(['2011-12-31']);
});

test('duplicate saves and rejected writes preserve a usable cursor', async () => {
  const f = await fixture();
  const saved = await f.save('2026-10-08T10:00:00.000Z');
  await f.save('2026-10-07T10:00:00.000Z');
  const page = await f.transactions.listPage({ pageSize: 1 });
  await f.transactions.save(
    { id: saved.id },
    {
      platform: saved.platform,
      fareAmountCents: saved.fareAmountCents,
      cashReceivedCents: saved.cashReceivedCents,
      tipCents: saved.tipCents,
    },
  );
  await expect(
    f.transactions.edit(saved.id, { ...validInput, fareAmountCents: -1 }),
  ).rejects.toThrow();
  await f.transactions.remove('missing');
  expect(
    (await f.transactions.listPage({ cursor: page.nextCursor! })).records,
  ).toHaveLength(1);
});

test('matched corruption fails history, summary and activity without contaminating unrelated date ranges', async () => {
  const f = await fixture();
  const broken = await f.save('2026-10-08T10:00:00.000Z');
  const good = await f.save('2026-09-08T10:00:00.000Z');
  await db.execute('PRAGMA ignore_check_constraints = ON');
  await db.execute(
    'UPDATE transactions SET net_cash_cents = 999 WHERE id = ?',
    [broken.id],
  );
  await expect(f.transactions.listPage({ bounds: october })).rejects.toThrow();
  await expect(f.transactions.summarize(october)).rejects.toThrow('Corrupt');
  await expect(
    f.transactions.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
  ).rejects.toThrow('Corrupt');
  const september = getCalendarMonthBounds({ year: 2026, month: 9 }, 'UTC');
  expect(await f.transactions.summarize(september)).toEqual(
    summarizeTransactions([good]),
  );
  expect(
    (await f.transactions.listPage({ bounds: september })).records,
  ).toEqual([good]);
  expect(
    await f.transactions.occupiedDates({ year: 2026, month: 9 }, 'UTC'),
  ).toEqual(['2026-09-08']);
});

test('legacy offset dates block optimized reads but retain existing get/list behavior', async () => {
  const f = await fixture();
  const saved = await f.save('2026-10-08T10:00:00.000Z');
  await db.execute('UPDATE transactions SET created_at = ? WHERE id = ?', [
    '2026-10-08T12:00:00+02:00',
    saved.id,
  ]);
  expect((await f.transactions.get(saved.id))?.createdAt).toBe(
    '2026-10-08T12:00:00+02:00',
  );
  expect(await f.transactions.list()).toHaveLength(1);
  await expect(f.transactions.listPage()).rejects.toThrow('canonical UTC');
  await expect(f.transactions.summarize(october)).rejects.toThrow(
    'canonical UTC',
  );
  await expect(
    f.transactions.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
  ).rejects.toThrow('canonical UTC');
});

test.each([
  ['fare_amount_cents', 0],
  ['fare_amount_cents', 1000000],
  ['fare_amount_cents', 100.5],
  ['cash_received_cents', 99],
  ['cash_received_cents', 100.5],
  ['tip_cents', 1],
  ['change_given_cents', -1],
  ['net_cash_cents', Number.MAX_SAFE_INTEGER + 1],
  ['platform', 'unknown'],
  ['updated_at', 'invalid timestamp'],
])(
  'corrupt stored %s=%s fails all matched optimized reads',
  async (column, value) => {
    const f = await fixture();
    const saved = await f.save('2026-10-08T10:00:00.000Z');
    await db.execute('PRAGMA ignore_check_constraints = ON');
    // Column identifiers come exclusively from this closed test table.
    await db.execute(`UPDATE transactions SET ${column} = ? WHERE id = ?`, [
      value,
      saved.id,
    ]);
    await expect(f.transactions.summarize(october)).rejects.toThrow();
    await expect(
      f.transactions.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
    ).rejects.toThrow();
    await expect(
      f.transactions.listPage({ bounds: october }),
    ).rejects.toThrow();
  },
);

test('millisecond ordering across UTC year boundary matches chronology and edits preserve creation time', async () => {
  const f = await fixture();
  const rows = [];
  for (const date of [
    '2026-01-01T00:00:00.001Z',
    '2025-12-31T23:59:59.999Z',
    '2026-01-01T00:00:00.999Z',
    '2025-12-31T23:59:59.001Z',
  ]) {
    rows.push(await f.save(date));
  }
  const edited = await f.transactions.edit(rows[1].id, {
    ...validInput,
    platform: 'bolt',
  });
  expect(edited.createdAt).toBe(rows[1].createdAt);
  rows[1] = edited;
  const expected = [...rows].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
  const records = [];
  let page = await f.transactions.listPage({ pageSize: 1 });
  records.push(...page.records);
  while (page.nextCursor) {
    page = await f.transactions.listPage({
      pageSize: 1,
      cursor: page.nextCursor,
    });
    records.push(...page.records);
  }
  expect(records).toEqual(expected);
  expect(
    (
      await f.transactions.listPage({
        bounds: getCalendarMonthBounds({ year: 2026, month: 1 }, 'UTC'),
      })
    ).records,
  ).toEqual(expected.slice(0, 2));
});

test('canonical-looking impossible calendar dates require compatibility decision without rewriting stored data', async () => {
  const f = await fixture();
  const saved = await f.save('2026-10-08T10:00:00.000Z');
  const impossible = '2026-02-30T10:00:00.000Z';
  await db.execute('UPDATE transactions SET created_at = ? WHERE id = ?', [
    impossible,
    saved.id,
  ]);
  await expect(f.transactions.listPage()).rejects.toThrow('canonical UTC');
  await expect(f.transactions.summarize(october)).rejects.toThrow(
    'canonical UTC',
  );
  await expect(
    f.transactions.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
  ).rejects.toThrow('canonical UTC');
  expect(
    (
      await db.execute('SELECT created_at FROM transactions WHERE id = ?', [
        saved.id,
      ])
    ).rows,
  ).toEqual([{ created_at: impossible }]);
});

test('legacy updated timestamps use bounded validation and retain Date.parse compatibility', async () => {
  const sizes: number[] = [];
  const wrapped: SqlConnection = {
    ...db,
    transaction: work =>
      db.transaction(tx =>
        work({
          execute: async (sql, params) => {
            const result = await tx.execute(sql, params);
            if (sql.includes('SELECT DISTINCT updated_at')) {
              sizes.push(result.rows.length);
            }
            return result;
          },
        }),
      ),
  };
  const f = await fixture(wrapped);
  for (let i = 0; i < 57; i++) {
    const saved = await f.save('2026-10-08T10:00:00.000Z');
    const legacy = new Date(Date.UTC(2026, 9, 8, 0, i))
      .toISOString()
      .replace('.000Z', '+00:00');
    await db.execute('UPDATE transactions SET updated_at = ? WHERE id = ?', [
      legacy,
      saved.id,
    ]);
  }
  const extra = await f.save('2026-10-08T10:00:00.000Z');
  await db.execute('UPDATE transactions SET updated_at = ? WHERE id = ?', [
    'October 8, 2026',
    extra.id,
  ]);
  const all = await f.transactions.list();
  expect(await f.transactions.summarize(october)).toEqual(
    summarizeTransactions(all),
  );
  expect(sizes.length).toBeGreaterThan(1);
  expect(Math.max(...sizes)).toBeLessThanOrEqual(50);
  expect(sizes.reduce((sum, size) => sum + size, 0)).toBe(58);
  expect(
    await f.transactions.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
  ).toEqual(['2026-10-08']);
  expect((await f.transactions.listPage()).records).toEqual(all.slice(0, 50));
  await db.execute('UPDATE transactions SET updated_at = ? WHERE id = ?', [
    'not a date',
    extra.id,
  ]);
  await expect(f.transactions.summarize(october)).rejects.toThrow('timestamp');
  await expect(
    f.transactions.occupiedDates({ year: 2026, month: 10 }, 'UTC'),
  ).rejects.toThrow('timestamp');
  await expect(f.transactions.listPage()).rejects.toThrow();
});

test.each([false, true])(
  'queued mutation failure=%s decides cursor validity after transaction completion',
  async fail => {
    let blocking = false;
    let release: (() => void) | undefined;
    let started: (() => void) | undefined;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const entered = new Promise<void>(resolve => {
      started = resolve;
    });
    const wrapped: SqlConnection = {
      ...db,
      transaction: work =>
        db.transaction(async tx => {
          await work(tx);
          if (blocking) {
            blocking = false;
            started?.();
            await gate;
            if (fail) {
              throw new Error('Commit failed');
            }
          }
        }),
    };
    const f = await fixture(wrapped);
    await f.save('2026-10-08T10:00:00.000Z');
    const older = await f.save('2026-10-07T10:00:00.000Z');
    const first = await f.transactions.listPage({ pageSize: 1 });
    blocking = true;
    const mutation = f.transactions.remove(older.id).then(
      () => 'committed',
      error => String(error),
    );
    await entered;
    const read = f.transactions.listPage({ cursor: first.nextCursor! }).then(
      page => page,
      error => String(error),
    );
    release?.();
    expect(await mutation).toBe(fail ? 'Error: Commit failed' : 'committed');
    const result = await read;
    if (fail) {
      expect(result).toEqual({ records: [older], nextCursor: null });
    } else {
      expect(result).toContain('cursor');
    }
  },
);

test('read failures can retry and unsafe adapter aggregates fail instead of displaying inaccurate amounts', async () => {
  let injected: 'error' | 'overflow' | null = null;
  let injectedRows: Array<Record<string, unknown>> | null = null;
  const wrapped: SqlConnection = {
    ...db,
    transaction: work =>
      db.transaction(tx => {
        const executor: SqlExecutor = {
          execute: async (sql, params) => {
            if (sql.includes('GROUP BY platform')) {
              if (injected === 'error') {
                throw new Error('Read unavailable');
              }
              if (injected === 'overflow') {
                throw new Error('integer overflow');
              }
              if (injectedRows) {
                return {
                  rowsAffected: 0,
                  rows: injectedRows,
                };
              }
            }
            return tx.execute(sql, params);
          },
        };
        return work(executor);
      }),
  };
  const f = await fixture(wrapped);
  const saved = await f.save('2026-10-08T10:00:00.000Z');
  injected = 'error';
  await expect(f.transactions.summarize(october)).rejects.toThrow(
    'Read unavailable',
  );
  injected = 'overflow';
  await expect(f.transactions.summarize(october)).rejects.toThrow(
    'integer overflow',
  );
  injected = null;
  const row = {
    platform: 'uber',
    operation_count: 1,
    invalid_count: 0,
    fare_total: 100,
    tip_total: 0,
    net_total: 100,
  };
  for (const field of [
    'operation_count',
    'fare_total',
    'tip_total',
    'net_total',
  ]) {
    for (const value of [Number.MAX_SAFE_INTEGER + 1, -1, 0.5, '100', null]) {
      injectedRows = [{ ...row, [field]: value }];
      await expect(f.transactions.summarize(october)).rejects.toThrow(
        'aggregate integer',
      );
    }
    injectedRows = [
      { ...row, [field]: Number.MAX_SAFE_INTEGER },
      { ...row, platform: 'bolt', [field]: 1 },
    ];
    await expect(f.transactions.summarize(october)).rejects.toThrow(
      'aggregate integer',
    );
  }
  injectedRows = null;
  expect(await f.transactions.summarize(october)).toEqual(
    summarizeTransactions([saved]),
  );
  expect(await f.transactions.get(saved.id)).toEqual(saved);
});
