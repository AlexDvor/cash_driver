/// <reference types="node" />
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openTestDatabase } from './sqliteTestDatabase';
import { migrateDatabase } from '../database/migrations';
import { seedCalendarVolume } from './calendarVolumeFixture';
import { verifyCalendarVolume } from './calendarNativeChecks';

test('four-platform multi-year file fixture preserves bounded reads and exact results after reopen', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'cashdriver-calendar-phase6-'));
  const path = join(directory, 'fixture.sqlite');
  let db = openTestDatabase(path);
  try {
    await migrateDatabase(db);
    await seedCalendarVolume(db);
    const before = await verifyCalendarVolume(db);
    db.close();
    db = openTestDatabase(path);
    const after = await verifyCalendarVolume(db);
    expect(after.totalRecords).toBe(10000);
    expect(after.selectedRecords).toBe(1001);
    expect(after.summary).toEqual(before.summary);
    expect(after.dates).toEqual(before.dates);
    expect(after.maxPageTransfer).toBeLessThanOrEqual(51);
    console.info(
      'Phase6 Node SQLite observations (not native SLO)',
      JSON.stringify(after),
    );
  } finally {
    db.close();
    for (const suffix of ['', '-wal', '-shm']) {
      rmSync(path + suffix, { force: true });
    }
    rmdirSync(directory);
  }
});
