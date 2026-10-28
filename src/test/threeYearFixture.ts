import { platforms } from '../constants/platforms';
import { getCalendarMonthDays } from '../features/summary/periods';
import { CashTransaction } from '../features/transactions/types';
import { SqlConnection, SqlValue } from '../database/sqlite';

export const threeYearFixture = {
  seed: 27102026,
  startDate: '2023-10-28',
  endDate: '2026-10-27',
  count: 109600,
};

export interface VolumeFixtureOptions {
  seed: number;
  startDate: string;
  endDate: string;
  count: number;
}

// Fixture-only cache avoids repeatedly resolving the same Madrid calendar in oracles.
const calendarMonths = new Map<
  string,
  ReturnType<typeof getCalendarMonthDays>
>();

export function* volumeRows(
  options: VolumeFixtureOptions,
): Generator<CashTransaction> {
  const start = Date.parse(`${options.startDate}T00:00:00Z`);
  const end = Date.parse(`${options.endDate}T00:00:00Z`);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end < start ||
    !Number.isSafeInteger(options.count) ||
    options.count < 0 ||
    !Number.isInteger(options.seed)
  ) {
    throw new Error('Invalid volume fixture options');
  }
  let seed = ((options.seed % 4294967296) + 4294967296) % 4294967296;
  const next = () => {
    seed =
      (((Math.imul(seed, 1664525) + 1013904223) % 4294967296) + 4294967296) %
      4294967296;
    return seed;
  };
  const days: { start: number; end: number; weight: number }[] = [];
  let month = '';
  let calendar: ReturnType<typeof getCalendarMonthDays> = [];
  for (let time = start, i = 0; time <= end; time += 86400000, i++) {
    const date = new Date(time);
    const key = date.toISOString().slice(0, 7);
    if (month !== key) {
      month = key;
      calendar =
        calendarMonths.get(key) ??
        getCalendarMonthDays(
          { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 },
          'Europe/Madrid',
        );
      calendarMonths.set(key, calendar);
    }
    const bounds = calendar[date.getUTCDate() - 1];
    days.push({
      start: bounds.start.getTime(),
      end: bounds.end.getTime(),
      weight: i % 17 === 3 ? 0 : 20 + (next() % 181),
    });
  }
  const totalWeight = days.reduce((sum, day) => sum + day.weight, 0);
  let cumulative = 0;
  let id = 0;
  for (const day of days) {
    const before = Math.floor((cumulative * options.count) / totalWeight);
    cumulative += day.weight;
    const count =
      Math.floor((cumulative * options.count) / totalWeight) - before;
    for (let i = 0; i < count; i++, id++) {
      const fare = id % 997 === 0 ? 999999 : 1 + (next() % 9000);
      const extra = fare === 999999 ? 0 : next() % 10000;
      const tip =
        id % 3 === 0 ? 0 : id % 3 === 1 ? extra : Math.floor(extra / 2);
      let instant =
        i === count - 1 ? day.end - 1 : day.start + Math.floor(i / 2) * 1000;
      const hours = (day.end - day.start) / 3600000;
      if ((hours === 23 || hours === 25) && i >= 2 && i <= 5 && i < count - 1) {
        const transition = day.start + (hours === 23 ? 2 : 3) * 3600000;
        instant = transition + [-1, 0, -1800000, 1800000][i - 2];
      }
      yield {
        id: `30000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
        platform: platforms[id % platforms.length],
        fareAmountCents: fare,
        cashReceivedCents: fare + extra,
        tipCents: tip,
        changeGivenCents: extra - tip,
        netCashCents: fare + tip,
        createdAt: new Date(instant).toISOString(),
        updatedAt: null,
      };
    }
  }
}

export async function seedVolumeFixture(
  db: SqlConnection,
  options: VolumeFixtureOptions,
) {
  await db.transaction(async tx => {
    let batch: SqlValue[][] = [];
    async function flush() {
      if (!batch.length) return;
      await tx.execute(
        `INSERT INTO transactions (id, platform, fare_amount_cents, cash_received_cents, change_given_cents, tip_cents, net_cash_cents, created_at, updated_at) VALUES ${batch
          .map(() => '(?,?,?,?,?,?,?,?,?)')
          .join(',')}`,
        batch.flat(),
      );
      batch = [];
    }
    for (const row of volumeRows(options)) {
      batch.push([
        row.id,
        row.platform,
        row.fareAmountCents,
        row.cashReceivedCents,
        row.changeGivenCents,
        row.tipCents,
        row.netCashCents,
        row.createdAt,
        row.updatedAt,
      ]);
      if (batch.length === 100) await flush();
    }
    await flush();
  });
}
