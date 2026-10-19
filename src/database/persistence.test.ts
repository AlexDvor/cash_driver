import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDatabaseManager } from './connection';
import {
  migrateDatabase,
  SCHEMA_VERSION,
  transactionSchema,
} from './migrations';
import { SqlConnection } from './sqlite';
import { decodePreferences } from '../features/settings/preferencesRepository';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from '../test/sqliteTestDatabase';

let db: SqlConnection;
beforeEach(() => {
  db = openTestDatabase();
});
afterEach(() => db.close());

test('concurrent reads wait for a transaction and never observe a rolled-back preference', async () => {
  const services = await testPersistence(db);
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const hasWritten = new Promise<void>(resolve => {
    started = resolve;
  });
  const write = db.transaction(async tx => {
    await tx.execute("UPDATE preferences SET language = 'uk' WHERE id = 1");
    started?.();
    await gate;
    throw new Error('Rollback');
  });
  // Observe the rejection immediately so no unhandled rejection is possible.
  const failure = write.then(
    () => 'Unexpected commit',
    error => String(error),
  );
  await hasWritten;
  let readFinished = false;
  const read = services.preferences.read().then(value => {
    readFinished = true;
    return value;
  });
  await Promise.resolve();
  expect(readFinished).toBe(false);
  release?.();
  expect(await failure).toContain('Rollback');
  expect((await read).language).toBe('es');
});

test('invalid preferences and missing singleton row fail without inventing replacement settings', async () => {
  const services = await testPersistence(db);
  const original = await services.preferences.read();
  const notify = jest.fn();
  services.changes.subscribe(notify);
  for (const patch of [
    { language: 'fr' },
    { themeMode: 'scheduled' },
    { defaultPlatform: 'unknown' },
    { hapticsEnabled: 1 },
  ]) {
    await expect(
      services.preferences.update(JSON.parse(JSON.stringify(patch))),
    ).rejects.toThrow();
  }
  expect(await services.preferences.read()).toEqual(original);
  expect(notify).not.toHaveBeenCalled();
  await db.execute('DELETE FROM preferences');
  await expect(services.preferences.read()).rejects.toThrow('missing');
  await expect(services.preferences.update({ language: 'uk' })).rejects.toThrow(
    'missing',
  );
  expect((await db.execute('SELECT * FROM preferences')).rows).toEqual([]);
});

test('preference decoding rejects noncanonical platform values rather than guessing a default', () => {
  for (const defaultPlatform of [
    'unknown',
    'Uber',
    'otro',
    '',
    null,
    undefined,
    0,
    true,
    ['uber'],
    { platform: 'uber' },
  ]) {
    expect(() =>
      decodePreferences(
        {
          language: 'es',
          theme_mode: 'system',
          default_platform: defaultPlatform,
          haptics_enabled: 0,
          sound_enabled: 1,
        },
        ['uber'],
      ),
    ).toThrow('Corrupt preferences');
  }
});

test('enabled platform validation rejects empty, duplicate, unknown and mismatched values', async () => {
  const services = await testPersistence(db);
  const original = await services.preferences.read();
  for (const enabledPlatforms of [
    [],
    ['uber', 'uber'],
    ['unknown'],
    ['Uber'],
    'uber',
    null,
  ]) {
    await expect(
      services.preferences.update(
        JSON.parse(JSON.stringify({ enabledPlatforms })),
      ),
    ).rejects.toThrow('enabled platforms');
  }
  await expect(
    services.preferences.update({
      defaultPlatform: 'uber',
      enabledPlatforms: ['bolt'],
    }),
  ).rejects.toThrow('Corrupt preferences');
  await expect(
    services.preferences.update({ defaultPlatform: 'bolt' }),
  ).rejects.toThrow('Corrupt preferences');
  expect(await services.preferences.read()).toEqual(original);
});

test('enabled platform updates use catalog order and atomically replace a removed default', async () => {
  const services = await testPersistence(db);
  await services.preferences.update({
    enabledPlatforms: ['other', 'bolt', 'cabify', 'uber'],
  });
  expect(await services.preferences.read()).toMatchObject({
    defaultPlatform: 'uber',
    enabledPlatforms: ['uber', 'cabify', 'bolt', 'other'],
  });
  await services.preferences.update({ defaultPlatform: 'bolt' });
  await services.preferences.update({ enabledPlatforms: ['other', 'cabify'] });
  expect(await services.preferences.read()).toMatchObject({
    defaultPlatform: 'cabify',
    enabledPlatforms: ['cabify', 'other'],
  });
});

test('corrupt enabled-platform storage fails instead of inventing a fallback', async () => {
  const services = await testPersistence(db);
  await db.execute('DELETE FROM preference_enabled_platforms');
  await expect(services.preferences.read()).rejects.toThrow(
    'Invalid enabled platforms',
  );
  await db.execute(
    "INSERT INTO preference_enabled_platforms VALUES (1, 'uber')",
  );
  await db.execute(
    "UPDATE preferences SET default_platform = 'bolt' WHERE id = 1",
  );
  await expect(services.preferences.read()).rejects.toThrow(
    'Corrupt preferences',
  );
});

test.each(['uber', 'cabify', 'bolt', 'other'] as const)(
  'v4 migration backfills only the saved %s default',
  async defaultPlatform => {
    await migrateDatabase(db);
    const preservedId = randomUUID();
    await db.execute(
      'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        preservedId,
        defaultPlatform,
        1200,
        1500,
        300,
        0,
        1200,
        '2026-10-12T10:00:00.000Z',
        null,
      ],
    );
    await db.execute(
      'UPDATE preferences SET default_platform = ? WHERE id = 1',
      [defaultPlatform],
    );
    await db.execute('DROP TABLE preference_enabled_platforms');
    await db.execute('ALTER TABLE preferences DROP COLUMN sound_enabled');
    await db.execute('PRAGMA user_version = 4');
    await migrateDatabase(db);
    expect(
      (
        await db.execute(
          'SELECT preference_id, platform FROM preference_enabled_platforms',
        )
      ).rows,
    ).toEqual([{ preference_id: 1, platform: defaultPlatform }]);
    expect((await db.execute('PRAGMA user_version')).rows).toEqual([
      { user_version: SCHEMA_VERSION },
    ]);
    expect(
      (
        await db.execute('SELECT id FROM transactions WHERE id = ?', [
          preservedId,
        ])
      ).rows,
    ).toEqual([{ id: preservedId }]);
  },
);

test('v5 migration failure rolls back its table, data and schema version', async () => {
  await migrateDatabase(db);
  await db.execute('DROP TABLE preference_enabled_platforms');
  await db.execute('ALTER TABLE preferences DROP COLUMN sound_enabled');
  await db.execute('PRAGMA user_version = 4');
  const failing: SqlConnection = {
    ...db,
    transaction: work =>
      db.transaction(tx =>
        work({
          async execute(sql, params) {
            const result = await tx.execute(sql, params);
            if (sql.startsWith('INSERT INTO preference_enabled_platforms')) {
              throw new Error('Injected v5 failure');
            }
            return result;
          },
        }),
      ),
  };
  await expect(migrateDatabase(failing)).rejects.toThrow('Injected v5 failure');
  expect((await db.execute('PRAGMA user_version')).rows).toEqual([
    { user_version: 4 },
  ]);
  expect(
    (
      await db.execute(
        "SELECT name FROM sqlite_master WHERE name = 'preference_enabled_platforms'",
      )
    ).rows,
  ).toEqual([]);
  expect(
    (await db.execute('SELECT default_platform FROM preferences')).rows,
  ).toEqual([{ default_platform: 'uber' }]);
});

test('a failing subscriber cannot turn a committed save into an apparent failure or suppress other subscribers', async () => {
  const services = await testPersistence(db);
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
  const changed = jest.fn();
  services.changes.subscribe(() => {
    throw new Error('Subscriber failed');
  });
  services.changes.subscribe(changed);
  try {
    const saved = await services.transactions.save(
      services.transactions.newPendingOperation(),
      validInput,
    );
    expect(await services.transactions.get(saved.id)).toEqual(saved);
    expect(changed).toHaveBeenCalledWith('transactions');
    expect(errorLog).toHaveBeenCalled();
  } finally {
    errorLog.mockRestore();
  }
});

test('initializes once for simultaneous callers, reopens a file without losing operations or preferences', async () => {
  const path = join(tmpdir(), `cash-driver-${randomUUID()}.sqlite`);
  let connection: SqlConnection | undefined;
  try {
    let opens = 0;
    const manager = createDatabaseManager(() => {
      opens++;
      connection = openTestDatabase(path);
      return connection;
    });
    const [first, second] = await Promise.all([
      manager.initialize(),
      manager.initialize(),
    ]);
    expect(first).toBe(second);
    expect(opens).toBe(1);
    const services = await testPersistence(first);
    const pending = services.transactions.newPendingOperation();
    const saved = await services.transactions.save(pending, validInput);
    await services.preferences.update({
      language: 'uk',
      themeMode: 'dark',
      defaultPlatform: 'bolt',
      enabledPlatforms: ['bolt'],
      hapticsEnabled: true,
      soundEnabled: true,
    });
    first.close();
    connection = openTestDatabase(path);
    const reopened = await testPersistence(connection);
    expect(await reopened.transactions.get(pending.id)).toEqual(saved);
    expect(await reopened.preferences.read()).toEqual({
      language: 'uk',
      themeMode: 'dark',
      defaultPlatform: 'bolt',
      enabledPlatforms: ['bolt'],
      hapticsEnabled: true,
      soundEnabled: true,
    });
    expect(
      (await connection.execute('PRAGMA user_version')).rows[0].user_version,
    ).toBe(SCHEMA_VERSION);
  } finally {
    connection?.close();
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      if (existsSync(path + suffix)) {
        unlinkSync(path + suffix);
      }
    }
  }
});

test('migration from v1 preserves rows, IDs, cents and creation time', async () => {
  await db.execute(transactionSchema);
  const id = randomUUID();
  await db.execute(
    'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, 'cabify', 1850, 2000, 150, 0, 1850, '2025-12-31T23:00:00.000Z', null],
  );
  await db.execute('PRAGMA user_version = 1');
  const services = await testPersistence(db);
  expect(await services.transactions.get(id)).toMatchObject({
    id,
    fareAmountCents: 1850,
    createdAt: '2025-12-31T23:00:00.000Z',
  });
  expect(await services.preferences.read()).toEqual({
    language: 'es',
    themeMode: 'system',
    defaultPlatform: 'uber',
    enabledPlatforms: ['uber'],
    hapticsEnabled: false,
    soundEnabled: true,
  });
  await migrateDatabase(db);
  expect(await services.transactions.list()).toHaveLength(1);
});

test('v5 sound migration preserves history/settings and later disabled choice survives migration', async () => {
  const services = await testPersistence(db);
  const saved = await services.transactions.save(
    services.transactions.newPendingOperation(),
    validInput,
  );
  await services.preferences.update({
    language: 'uk',
    themeMode: 'dark',
    hapticsEnabled: true,
    enabledPlatforms: ['cabify', 'bolt'],
  });
  const previous = await services.preferences.read();
  await db.execute('ALTER TABLE preferences DROP COLUMN sound_enabled');
  await db.execute('PRAGMA user_version = 5');
  await migrateDatabase(db);
  expect(await services.transactions.list()).toEqual([saved]);
  expect(await services.preferences.read()).toEqual({
    ...previous,
    soundEnabled: true,
  });
  await services.preferences.update({ soundEnabled: false });
  await migrateDatabase(db);
  expect((await services.preferences.read()).soundEnabled).toBe(false);
  await expect(
    services.preferences.update(JSON.parse('{"soundEnabled":1}')),
  ).rejects.toThrow('Invalid sound');
  await expect(
    db.execute('UPDATE preferences SET sound_enabled = 2'),
  ).rejects.toThrow();
  expect((await services.preferences.read()).soundEnabled).toBe(false);
});

test('failed v6 migration rolls back the added column and keeps history for retry', async () => {
  const services = await testPersistence(db);
  const saved = await services.transactions.save(
    services.transactions.newPendingOperation(),
    validInput,
  );
  await db.execute('ALTER TABLE preferences DROP COLUMN sound_enabled');
  await db.execute('PRAGMA user_version = 5');
  const failing: SqlConnection = {
    ...db,
    transaction: work =>
      db.transaction(tx =>
        work({
          async execute(sql, params) {
            const result = await tx.execute(sql, params);
            if (sql.includes('ADD COLUMN sound_enabled'))
              throw new Error('Injected v6 failure');
            return result;
          },
        }),
      ),
  };
  await expect(migrateDatabase(failing)).rejects.toThrow('Injected v6 failure');
  expect((await db.execute('PRAGMA user_version')).rows[0].user_version).toBe(
    5,
  );
  expect(
    (await db.execute('PRAGMA table_info(preferences)')).rows.some(
      row => row.name === 'sound_enabled',
    ),
  ).toBe(false);
  expect(await services.transactions.list()).toEqual([saved]);
  await migrateDatabase(db);
  expect((await services.preferences.read()).soundEnabled).toBe(true);
});

test.each([null, 0, 1])(
  'v2 migration resolves only unset haptics (%s) without changing saved data',
  async haptics => {
    const services = await testPersistence(db);
    const row = await services.transactions.save(
      services.transactions.newPendingOperation(),
      validInput,
    );
    await db.execute(
      'UPDATE preferences SET language = ?, theme_mode = ?, default_platform = ?, haptics_enabled = ? WHERE id = 1',
      ['uk', 'dark', 'bolt', haptics],
    );
    await db.execute('DROP TABLE preference_enabled_platforms');
    await db.execute('ALTER TABLE preferences DROP COLUMN sound_enabled');
    await db.execute('PRAGMA user_version = 2');
    await migrateDatabase(db);
    expect(await services.preferences.read()).toEqual({
      language: 'uk',
      themeMode: 'dark',
      defaultPlatform: 'bolt',
      enabledPlatforms: ['bolt'],
      hapticsEnabled: haptics === 1,
      soundEnabled: true,
    });
    expect(await services.transactions.get(row.id)).toEqual(row);
    await migrateDatabase(db);
    expect((await db.execute('PRAGMA user_version')).rows[0].user_version).toBe(
      SCHEMA_VERSION,
    );
  },
);

test('migration failure rolls back DDL and version; future versions are rejected without deleting data', async () => {
  await db.execute('CREATE TABLE preferences (sentinel TEXT)');
  await db.execute('INSERT INTO preferences VALUES (?)', ['keep']);
  await expect(migrateDatabase(db)).rejects.toThrow();
  expect((await db.execute('PRAGMA user_version')).rows[0].user_version).toBe(
    0,
  );
  expect(
    (
      await db.execute(
        "SELECT name FROM sqlite_master WHERE name = 'transactions'",
      )
    ).rows,
  ).toEqual([]);
  expect((await db.execute('SELECT * FROM preferences')).rows).toEqual([
    { sentinel: 'keep' },
  ]);
  await db.execute('PRAGMA user_version = 99');
  await expect(migrateDatabase(db)).rejects.toThrow('Unsupported');
  expect((await db.execute('SELECT * FROM preferences')).rows).toEqual([
    { sentinel: 'keep' },
  ]);
});

test('corrupt files are never replaced; failed open can be retried', async () => {
  const path = join(tmpdir(), `cash-driver-corrupt-${randomUUID()}.sqlite`);
  const bytes = Buffer.from('not a SQLite database - preserve me');
  writeFileSync(path, bytes);
  try {
    const manager = createDatabaseManager(() => openTestDatabase(path));
    await expect(manager.initialize()).rejects.toThrow();
    await expect(manager.initialize()).rejects.toThrow();
    expect(readFileSync(path)).toEqual(bytes);
  } finally {
    unlinkSync(path);
  }
  let unavailable = true;
  const manager = createDatabaseManager(() => {
    if (unavailable) {
      throw new Error('Unavailable');
    }
    return db;
  });
  await expect(manager.initialize()).rejects.toThrow('Unavailable');
  unavailable = false;
  expect(
    (await (await manager.initialize()).execute('PRAGMA user_version')).rows[0]
      .user_version,
  ).toBe(SCHEMA_VERSION);
});

test('create/read/edit/delete derive money, preserve createdAt and notify only after commit', async () => {
  let time = new Date('2026-10-08T10:00:00Z');
  const services = await testPersistence(db, () => time);
  const notifications: string[] = [];
  const unsubscribe = services.changes.subscribe(kind =>
    notifications.push(kind),
  );
  const pending = services.transactions.newPendingOperation();
  const saved = await services.transactions.save(pending, validInput);
  expect(saved).toEqual({
    id: pending.id,
    platform: 'uber',
    fareAmountCents: 1800,
    cashReceivedCents: 2000,
    changeGivenCents: 0,
    tipCents: 200,
    netCashCents: 2000,
    createdAt: time.toISOString(),
    updatedAt: null,
  });
  time = new Date('2026-10-09T11:00:00Z');
  const edited = await services.transactions.edit(saved.id, {
    ...validInput,
    platform: 'bolt',
    fareAmountCents: 1750,
    tipCents: 0,
  });
  expect(edited).toMatchObject({
    createdAt: saved.createdAt,
    updatedAt: time.toISOString(),
    changeGivenCents: 250,
    tipCents: 0,
    netCashCents: 1750,
  });
  expect(await services.transactions.list()).toEqual([edited]);
  await services.transactions.remove("' OR 1=1 --");
  expect(await services.transactions.get(saved.id)).toEqual(edited);
  await services.transactions.remove(saved.id);
  await services.transactions.remove(saved.id);
  expect(await services.transactions.get(saved.id)).toBeNull();
  expect(notifications).toEqual([
    'transactions',
    'transactions',
    'transactions',
  ]);
  unsubscribe();
  await services.transactions.save(
    services.transactions.newPendingOperation(),
    validInput,
  );
  expect(notifications).toHaveLength(3);
});

test('same pending ID is protected concurrently and after commit, conflicting input is rejected', async () => {
  const services = await testPersistence(db);
  const notify = jest.fn();
  services.changes.subscribe(notify);
  const pending = services.transactions.newPendingOperation();
  const first = services.transactions.save(pending, validInput);
  const second = services.transactions.save(pending, validInput);
  expect(first).toBe(second);
  await expect(
    services.transactions.save(pending, { ...validInput, platform: 'bolt' }),
  ).rejects.toThrow('changed');
  const saved = await first;
  expect(await services.transactions.save(pending, validInput)).toEqual(saved);
  await expect(
    services.transactions.save(pending, {
      ...validInput,
      fareAmountCents: 1900,
      tipCents: 100,
    }),
  ).rejects.toThrow('different');
  expect(await services.transactions.list()).toEqual([saved]);
  expect(notify).toHaveBeenCalledTimes(1);
});

test.each([0, -1, 0.5, 1000000, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid fare %s before a write',
  async fareAmountCents => {
    const services = await testPersistence(db);
    const notify = jest.fn();
    services.changes.subscribe(notify);
    await expect(
      services.transactions.save(services.transactions.newPendingOperation(), {
        ...validInput,
        fareAmountCents,
      }),
    ).rejects.toThrow('Invalid');
    expect(await services.transactions.list()).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  },
);

test('rejects underpayment, invalid received amount, platform, ID and nonnumeric tip without affecting saved data', async () => {
  const services = await testPersistence(db);
  const saved = await services.transactions.save(
    services.transactions.newPendingOperation(),
    validInput,
  );
  for (const cashReceivedCents of [1799, -1, 1000000, 2000.1]) {
    await expect(
      services.transactions.edit(saved.id, {
        ...validInput,
        cashReceivedCents,
      }),
    ).rejects.toThrow('Invalid');
  }
  await expect(
    services.transactions.save({ id: 'bad' }, validInput),
  ).rejects.toThrow('Invalid');
  await expect(
    services.transactions.save(services.transactions.newPendingOperation(), {
      ...validInput,
      ...JSON.parse('{"platform":"unknown"}'),
    }),
  ).rejects.toThrow('Invalid');
  await expect(
    services.transactions.save(services.transactions.newPendingOperation(), {
      ...validInput,
      ...JSON.parse('{"tipCents":true}'),
    }),
  ).rejects.toThrow('Invalid');
  expect(await services.transactions.list()).toEqual([saved]);
});

test('real SQLite bindings store integer cents and constraints reject fractions and inconsistent arithmetic', async () => {
  const services = await testPersistence(db);
  const saved = await services.transactions.save(
    services.transactions.newPendingOperation(),
    {
      ...validInput,
      fareAmountCents: 999999,
      cashReceivedCents: 999999,
      tipCents: 0,
    },
  );
  expect(
    (
      await db.execute(
        'SELECT typeof(fare_amount_cents) AS fare, typeof(cash_received_cents) AS received, typeof(change_given_cents) AS change, typeof(tip_cents) AS tip, typeof(net_cash_cents) AS net FROM transactions',
      )
    ).rows,
  ).toEqual([
    {
      fare: 'integer',
      received: 'integer',
      change: 'integer',
      tip: 'integer',
      net: 'integer',
    },
  ]);
  for (const amounts of [
    [0.5, 1.5, 1, 0, 0.5],
    [1000000, 1000000, 0, 0, 1000000],
    [10, 9, 0, 0, 10],
    [10, 20, 5, 6, 16],
    [10, 20, 10, 0, 20],
  ]) {
    await expect(
      db.execute(
        'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [randomUUID(), 'uber', ...amounts, saved.createdAt, null],
      ),
    ).rejects.toThrow();
  }
  expect(await services.transactions.list()).toEqual([saved]);
});

test('failed writes roll back, preserve records/preferences and pending ID can retry without a duplicate or notification', async () => {
  let fail = false;
  const unreliable: SqlConnection = {
    ...db,
    transaction: work =>
      db.transaction(async tx => {
        await work(tx);
        if (fail) {
          throw new Error('Disk full');
        }
      }),
  };
  const services = await testPersistence(unreliable);
  const notify = jest.fn();
  services.changes.subscribe(notify);
  const pending = services.transactions.newPendingOperation();
  fail = true;
  await expect(services.transactions.save(pending, validInput)).rejects.toThrow(
    'Disk full',
  );
  expect(await services.transactions.list()).toEqual([]);
  expect(notify).not.toHaveBeenCalled();
  fail = false;
  const saved = await services.transactions.save(pending, validInput);
  fail = true;
  await expect(
    services.transactions.edit(saved.id, {
      ...validInput,
      fareAmountCents: 1700,
    }),
  ).rejects.toThrow('Disk full');
  await expect(services.transactions.remove(saved.id)).rejects.toThrow(
    'Disk full',
  );
  await expect(services.transactions.removeAll()).rejects.toThrow('Disk full');
  await expect(
    services.preferences.update({ enabledPlatforms: ['uber', 'bolt'] }),
  ).rejects.toThrow('Disk full');
  expect(await services.transactions.list()).toEqual([saved]);
  fail = false;
  expect(await services.preferences.read()).toMatchObject({
    language: 'es',
    defaultPlatform: 'uber',
    enabledPlatforms: ['uber'],
  });
  expect(notify).toHaveBeenCalledTimes(1);
  await services.preferences.update({
    enabledPlatforms: ['cabify', 'uber'],
  });
  await Promise.all([
    services.preferences.update({ language: 'uk' }),
    services.preferences.update({ themeMode: 'dark' }),
    services.preferences.update({
      defaultPlatform: 'cabify',
      hapticsEnabled: false,
      soundEnabled: true,
    }),
  ]);
  expect(await services.preferences.read()).toEqual({
    language: 'uk',
    themeMode: 'dark',
    defaultPlatform: 'cabify',
    enabledPlatforms: ['uber', 'cabify'],
    hapticsEnabled: false,
    soundEnabled: true,
  });
  await services.transactions.removeAll();
  expect((await services.preferences.read()).language).toBe('uk');
});
