import { SqlConnection, SqlExecutor, SqlValue } from '../../database/sqlite';
import { isPlatform } from '../../constants/platforms';
import {
  CalendarMonth,
  getCalendarMonthBounds,
  getCalendarMonthDays,
  PeriodBounds,
} from '../summary/periods';
import { averageFareCents, CashSummary } from '../summary/summary';
import { MAX_INPUT_CENTS } from './money';
import { decodeTransaction } from './transactionDecoder';
import {
  HISTORY_PAGE_SIZE,
  HistoryPage,
  HistoryPageRequest,
  HistoryReadFilter,
} from './transactionReadContracts';
import { CashTransaction } from './types';

export class TimestampCompatibilityError extends Error {
  constructor() {
    super(
      'Optimized reads require canonical UTC timestamps; legacy compatibility decision required',
    );
    this.name = 'TimestampCompatibilityError';
  }
}

function canonicalTimestamp(value: string): boolean {
  const date = new Date(value);
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString() === value
  );
}

// Internal column names only. Round-trip validation rejects invalid calendar dates
// and representations whose lexical ordering is not chronological ordering.
function canonicalTimestampSql(column: string): string {
  return `(typeof(${column}) = 'text' AND length(${column}) = 24
    AND COALESCE(strftime('%Y-%m-%dT%H:%M:%fZ', ${column}, '+0 days') = ${column}, 0))`;
}

const validRowSql = `(typeof(id) = 'text' AND platform IN ('uber', 'cabify', 'bolt', 'other')
  AND typeof(fare_amount_cents) = 'integer' AND fare_amount_cents BETWEEN 1 AND ${MAX_INPUT_CENTS}
  AND typeof(cash_received_cents) = 'integer' AND cash_received_cents BETWEEN 0 AND ${MAX_INPUT_CENTS}
  AND typeof(tip_cents) = 'integer' AND tip_cents BETWEEN 0 AND ${MAX_INPUT_CENTS}
  AND typeof(change_given_cents) = 'integer' AND change_given_cents >= 0
  AND typeof(net_cash_cents) = 'integer' AND net_cash_cents >= 0
  AND cash_received_cents >= fare_amount_cents
  AND tip_cents <= cash_received_cents - fare_amount_cents
  AND change_given_cents = cash_received_cents - fare_amount_cents - tip_cents
  AND net_cash_cents = fare_amount_cents + tip_cents
  AND ${canonicalTimestampSql('created_at')}
  AND (updated_at IS NULL OR typeof(updated_at) = 'text'))`;

function nonnegativeInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Unsafe or invalid aggregate integer');
  }
  return value;
}

function rangeValues(bounds: Readonly<PeriodBounds>): [string, string] {
  const start = bounds.start.toISOString();
  const end = bounds.end.toISOString();
  if (bounds.start > bounds.end) {
    throw new RangeError('Reversed query range');
  }
  if (!canonicalTimestamp(start) || !canonicalTimestamp(end)) {
    throw new TimestampCompatibilityError();
  }
  return [start, end];
}

function readFilter(filter: HistoryReadFilter) {
  const clauses: string[] = [];
  const params: SqlValue[] = [];
  const range = filter.bounds ? rangeValues(filter.bounds) : null;
  if (range) {
    clauses.push('created_at >= ? AND created_at < ?');
    params.push(...range);
  }
  if (filter.platform !== undefined) {
    if (!isPlatform(filter.platform)) {
      throw new RangeError('Invalid query platform');
    }
    clauses.push('platform = ?');
    params.push(filter.platform);
  }
  return {
    where: clauses.length ? clauses.join(' AND ') : '1 = 1',
    params,
    queryKey: JSON.stringify([range, filter.platform ?? null]),
  };
}

export function createTransactionReadRepository(db: SqlConnection) {
  let revision = 0;
  let timestampsChecked = false;

  async function checkTimestamps(tx: SqlExecutor) {
    if (timestampsChecked) {
      return;
    }
    // One compact compatibility preflight per repository lifetime. The database
    // owns a full scan here; no full history is transferred to JavaScript.
    const incompatible = await tx.execute(
      `SELECT id FROM transactions WHERE NOT ${canonicalTimestampSql(
        'created_at',
      )} LIMIT 1`,
    );
    if (incompatible.rows.length) {
      throw new TimestampCompatibilityError();
    }
    timestampsChecked = true;
  }

  async function checkUpdatedTimestamps(
    tx: SqlExecutor,
    filter: ReturnType<typeof readFilter>,
  ) {
    let after: string | undefined;
    // Canonical service writes validate in SQL. Preserve the old decoder's wider
    // Date.parse contract for legacy updatedAt (not used for cursor ordering),
    // transferring only bounded batches of exceptional distinct timestamp texts.
    while (true) {
      const result = await tx.execute(
        `SELECT DISTINCT updated_at FROM transactions WHERE ${filter.where}
          AND updated_at IS NOT NULL AND NOT ${canonicalTimestampSql(
            'updated_at',
          )}
          ${after === undefined ? '' : 'AND updated_at > ?'}
          ORDER BY updated_at ASC LIMIT ?`,
        [
          ...filter.params,
          ...(after === undefined ? [] : [after]),
          HISTORY_PAGE_SIZE,
        ],
      );
      for (const row of result.rows) {
        if (
          typeof row.updated_at !== 'string' ||
          !Number.isFinite(Date.parse(row.updated_at))
        ) {
          throw new Error('Corrupt matched transaction timestamp');
        }
        after = row.updated_at;
      }
      if (result.rows.length < HISTORY_PAGE_SIZE) {
        return;
      }
    }
  }

  return {
    // Repository writes invalidate cursors. Canonical writes cannot introduce
    // timestamp incompatibility; unsupported raw/external writes need reopening.
    invalidate(record?: CashTransaction) {
      revision += 1;
      if (record && !canonicalTimestamp(record.createdAt)) {
        timestampsChecked = false;
      }
    },
    async listPage(request: HistoryPageRequest = {}): Promise<HistoryPage> {
      const filter = readFilter(request);
      const pageSize = request.pageSize ?? HISTORY_PAGE_SIZE;
      if (
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > HISTORY_PAGE_SIZE
      ) {
        throw new RangeError('Invalid bounded page size');
      }
      const cursor = request.cursor ? { ...request.cursor } : undefined;
      let page: HistoryPage = { records: [], nextCursor: null };
      await db.transaction(async tx => {
        await checkTimestamps(tx);
        if (
          cursor &&
          (cursor.queryKey !== filter.queryKey ||
            cursor.revision !== revision ||
            !canonicalTimestamp(cursor.createdAt) ||
            typeof cursor.id !== 'string')
        ) {
          throw new RangeError('Stale or invalid history cursor');
        }
        const after = cursor ? ' AND (created_at, id) < (?, ?)' : '';
        const params = [...filter.params];
        if (cursor) {
          params.push(cursor.createdAt, cursor.id);
        }
        const result = await tx.execute(
          `SELECT * FROM transactions WHERE ${filter.where}${after}
            ORDER BY created_at DESC, id DESC LIMIT ?`,
          [...params, pageSize + 1],
        );
        const records = result.rows.slice(0, pageSize).map(decodeTransaction);
        const last = records[records.length - 1];
        page = {
          records,
          nextCursor:
            result.rows.length > pageSize && last
              ? {
                  createdAt: last.createdAt,
                  id: last.id,
                  queryKey: filter.queryKey,
                  revision,
                }
              : null,
        };
      });
      return page;
    },
    async summarize(bounds: Readonly<PeriodBounds>): Promise<CashSummary> {
      const filter = readFilter({ bounds });
      let summary: CashSummary = {
        operationCount: 0,
        fareTotalCents: 0,
        tipTotalCents: 0,
        netCashTotalCents: 0,
        averageFareCents: 0,
        fareByPlatformCents: { uber: 0, cabify: 0, bolt: 0, other: 0 },
      };
      await db.transaction(async tx => {
        await checkTimestamps(tx);
        await checkUpdatedTimestamps(tx, filter);
        // CASE has an explicit ELSE: NULL predicates are invalid, never skipped.
        const result = await tx.execute(
          `SELECT platform, COUNT(*) AS operation_count,
            SUM(CASE WHEN ${validRowSql} THEN 0 ELSE 1 END) AS invalid_count,
            SUM(fare_amount_cents) AS fare_total,
            SUM(tip_cents) AS tip_total, SUM(net_cash_cents) AS net_total
            FROM transactions WHERE ${filter.where} GROUP BY platform`,
          filter.params,
        );
        for (const row of result.rows) {
          if (
            !isPlatform(row.platform) ||
            nonnegativeInteger(row.invalid_count) !== 0
          ) {
            throw new Error('Corrupt matched transaction values');
          }
          const count = nonnegativeInteger(row.operation_count);
          const fare = nonnegativeInteger(row.fare_total);
          const tip = nonnegativeInteger(row.tip_total);
          const net = nonnegativeInteger(row.net_total);
          summary.operationCount = nonnegativeInteger(
            summary.operationCount + count,
          );
          summary.fareTotalCents = nonnegativeInteger(
            summary.fareTotalCents + fare,
          );
          summary.tipTotalCents = nonnegativeInteger(
            summary.tipTotalCents + tip,
          );
          summary.netCashTotalCents = nonnegativeInteger(
            summary.netCashTotalCents + net,
          );
          summary.fareByPlatformCents[row.platform] = fare;
        }
        summary.averageFareCents = averageFareCents(
          summary.fareTotalCents,
          summary.operationCount,
        );
      });
      return summary;
    },
    async occupiedDates(
      month: Readonly<CalendarMonth>,
      timeZone: string,
    ): Promise<string[]> {
      const days = getCalendarMonthDays(month, timeZone).filter(
        day => day.start < day.end,
      );
      const ranges = days.map(day => ({
        dateKey: day.dateKey,
        range: rangeValues(day),
      }));
      const occupied: string[] = [];
      await db.transaction(async tx => {
        await checkTimestamps(tx);
        const first = ranges[0];
        const last = ranges[ranges.length - 1];
        if (first && last) {
          await checkUpdatedTimestamps(
            tx,
            readFilter({
              bounds: {
                start: new Date(first.range[0]),
                end: new Date(last.range[1]),
              },
            }),
          );
        }
        // Each indexed local-day range uses independently resolved UTC bounds.
        // The snapshot returns at most one aggregate per calendar day, no records.
        for (const day of ranges) {
          const result = await tx.execute(
            `SELECT COUNT(*) AS operation_count,
              COALESCE(SUM(CASE WHEN ${validRowSql} THEN 0 ELSE 1 END), 0) AS invalid_count
              FROM transactions WHERE created_at >= ? AND created_at < ?`,
            day.range,
          );
          const row = result.rows[0];
          if (!row || nonnegativeInteger(row.invalid_count) !== 0) {
            throw new Error('Corrupt matched transaction values');
          }
          if (nonnegativeInteger(row.operation_count) > 0) {
            occupied.push(day.dateKey);
          }
        }
      });
      return occupied;
    },
    async occupiedMonths(year: number, timeZone: string): Promise<number[]> {
      const ranges = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        range: rangeValues(
          getCalendarMonthBounds({ year, month: index + 1 }, timeZone),
        ),
      }));
      const occupied: number[] = [];
      await db.transaction(async tx => {
        await checkTimestamps(tx);
        await checkUpdatedTimestamps(
          tx,
          readFilter({
            bounds: {
              start: new Date(ranges[0].range[0]),
              end: new Date(ranges[11].range[1]),
            },
          }),
        );
        // Twelve indexed local-month ranges in one snapshot; no history rows
        // are transferred, and all platforms count, including zero-tip payments.
        for (const month of ranges) {
          const result = await tx.execute(
            `SELECT COUNT(*) AS operation_count,
              COALESCE(SUM(CASE WHEN ${validRowSql} THEN 0 ELSE 1 END), 0) AS invalid_count
              FROM transactions WHERE created_at >= ? AND created_at < ?`,
            month.range,
          );
          const row = result.rows[0];
          if (!row || nonnegativeInteger(row.invalid_count) !== 0) {
            throw new Error('Corrupt matched transaction values');
          }
          if (nonnegativeInteger(row.operation_count) > 0) {
            occupied.push(month.month);
          }
        }
      });
      return occupied;
    },
    async hasAny(): Promise<boolean> {
      const result = await db.execute(
        'SELECT 1 AS present FROM transactions LIMIT 1',
      );
      return result.rows.length !== 0;
    },
  };
}
