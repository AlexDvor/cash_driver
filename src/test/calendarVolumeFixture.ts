import { platforms } from '../constants/platforms';
import { CashTransaction } from '../features/transactions/types';
import { SqlConnection } from '../database/sqlite';

export const CALENDAR_FIXTURE_COUNT = 10000;

// Test-only deterministic records: dense Oct2026, sparse Feb2025, empty2019,
// four platforms, timestamp ties, multiyear history and Madrid DST boundaries.
export function* calendarVolumeRows(): Generator<CashTransaction> {
  for (let i = 0; i < CALENDAR_FIXTURE_COUNT; i++) {
    let createdAt = new Date(
      Date.UTC(2020 + (i % 5), i % 12, 1 + (Math.floor(i / 12) % 28), 12),
    ).toISOString();
    if (i < 1000) {
      createdAt = '2026-10-08T10:00:00.000Z';
    }
    if (i >= 1000 && i < 1004) {
      createdAt = `2025-02-${String((i - 999) * 7).padStart(
        2,
        '0',
      )}T12:00:00.000Z`;
    }
    if (i === 1004) {
      createdAt = '2026-03-28T23:30:00.000Z';
    }
    if (i === 1005) {
      createdAt = '2026-10-24T23:30:00.000Z';
    }
    const tipCents = i % 2;
    yield {
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      platform: platforms[i % platforms.length],
      fareAmountCents: 100,
      cashReceivedCents: 101,
      tipCents,
      changeGivenCents: 1 - tipCents,
      netCashCents: 100 + tipCents,
      createdAt,
      updatedAt: null,
    };
  }
}

// Caller supplies only an isolated test connection, never production persistence.
export async function seedCalendarVolume(db: SqlConnection) {
  await db.transaction(async tx => {
    for (const row of calendarVolumeRows()) {
      await tx.execute(
        'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          row.id,
          row.platform,
          row.fareAmountCents,
          row.cashReceivedCents,
          row.changeGivenCents,
          row.tipCents,
          row.netCashCents,
          row.createdAt,
          row.updatedAt,
        ],
      );
    }
  });
}
