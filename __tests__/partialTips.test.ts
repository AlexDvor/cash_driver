import { randomUUID } from 'node:crypto';
import { migrateDatabase, transactionSchema } from '../src/database/migrations';
import { SqlConnection } from '../src/database/sqlite';
import { calculatePayment } from '../src/features/transactions/payment';
import { TransactionInput } from '../src/features/transactions/transactionService';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

const input: TransactionInput = {
  platform: 'uber',
  fareAmountCents: 2000,
  cashReceivedCents: 5000,
  tipCents: 500,
};
let db: SqlConnection;
beforeEach(() => {
  db = openTestDatabase();
});
afterEach(() => db.close());

test('partial tips survive create, read, retry and edit with exact monetary amounts', async () => {
  const { transactions } = await testPersistence(db);
  const pending = transactions.newPendingOperation();
  const saved = await transactions.save(pending, input);
  expect(saved).toMatchObject({
    tipCents: 500,
    changeGivenCents: 2500,
    netCashCents: 2500,
  });
  expect(await transactions.get(saved.id)).toEqual(saved);
  expect(await transactions.save(pending, input)).toEqual(saved);
  await expect(
    transactions.save(pending, { ...input, tipCents: 600 }),
  ).rejects.toThrow();
  const edited = await transactions.edit(saved.id, { ...input, tipCents: 750 });
  expect(edited).toMatchObject({
    id: saved.id,
    createdAt: saved.createdAt,
    tipCents: 750,
    changeGivenCents: 2250,
    netCashCents: 2750,
  });
  expect(edited.updatedAt).not.toBeNull();
  expect(await transactions.list()).toEqual([edited]);
});

test('inflight saves distinguish exact tip amounts', async () => {
  const { transactions } = await testPersistence(db);
  const pending = transactions.newPendingOperation();
  const first = transactions.save(pending, input);
  expect(transactions.save(pending, { ...input })).toBe(first);
  await expect(
    transactions.save(pending, { ...input, tipCents: 501 }),
  ).rejects.toThrow();
  await first;
  expect(await transactions.list()).toHaveLength(1);
});

test.each([
  -1,
  3001,
  0.5,
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1,
  '500',
  null,
  undefined,
  true,
])('invalid tip %p cannot become a committed operation', async tipCents => {
  const malformed = { ...input, tipCents } as unknown as TransactionInput;
  expect(calculatePayment(malformed).status).toBe('invalid');
  const { transactions } = await testPersistence(db);
  await expect(
    transactions.save(transactions.newPendingOperation(), malformed),
  ).rejects.toThrow();
  expect(await transactions.list()).toEqual([]);
});

async function seedLegacy(version: number) {
  await db.execute(transactionSchema);
  await db.execute(
    'CREATE INDEX transactions_created_at_idx ON transactions(created_at)',
  );
  await db.execute(
    'CREATE INDEX transactions_platform_created_at_idx ON transactions(platform, created_at)',
  );
  for (const tip of [0, 3000]) {
    await db.execute(
      'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomUUID(),
        'uber',
        2000,
        5000,
        3000 - tip,
        tip,
        2000 + tip,
        '2026-10-01T10:00:00Z',
        '2026-10-02T10:00:00Z',
      ],
    );
  }
  if (version >= 2) {
    await db.execute(
      `CREATE TABLE preferences (id INTEGER PRIMARY KEY, language TEXT NOT NULL, theme_mode TEXT NOT NULL, default_platform TEXT NOT NULL, haptics_enabled INTEGER)`,
    );
    await db.execute(
      "INSERT INTO preferences VALUES (1, 'uk', 'dark', 'bolt', 0)",
    );
  }
  await db.execute(`PRAGMA user_version = ${version}`);
}

test.each([1, 2, 3])(
  'upgrade from v%i preserves legacy money, IDs, timestamps and preferences',
  async version => {
    await seedLegacy(version);
    const original = (
      await db.execute('SELECT * FROM transactions ORDER BY id')
    ).rows;
    await migrateDatabase(db);
    expect((await db.execute('PRAGMA user_version')).rows).toEqual([
      { user_version: 4 },
    ]);
    expect(
      (await db.execute('SELECT * FROM transactions ORDER BY id')).rows,
    ).toEqual(original);
    const indexes = (
      await db.execute('PRAGMA index_list(transactions)')
    ).rows.map(row => row.name);
    expect(indexes).toEqual(
      expect.arrayContaining([
        'transactions_created_at_idx',
        'transactions_platform_created_at_idx',
      ]),
    );
    if (version >= 2) {
      expect((await db.execute('SELECT * FROM preferences')).rows).toEqual([
        {
          id: 1,
          language: 'uk',
          theme_mode: 'dark',
          default_platform: 'bolt',
          haptics_enabled: 0,
        },
      ]);
    }
    await migrateDatabase(db);
    expect(
      (await db.execute('SELECT * FROM transactions ORDER BY id')).rows,
    ).toEqual(original);
    const { transactions } = await testPersistence(db);
    expect(await transactions.list()).toHaveLength(2);
    await transactions.save(transactions.newPendingOperation(), input);
  },
);

test('failure after removing the legacy table rolls back schema, records, indexes and version', async () => {
  await seedLegacy(3);
  const original = (
    await db.execute('SELECT type, name, sql FROM sqlite_master ORDER BY name')
  ).rows;
  const rows = (await db.execute('SELECT * FROM transactions ORDER BY id'))
    .rows;
  let injected = false;
  const failing: SqlConnection = {
    execute: db.execute,
    close: () => {},
    transaction: work =>
      db.transaction(tx =>
        work({
          async execute(sql, parameters) {
            const result = await tx.execute(sql, parameters);
            if (/DROP TABLE\s+["`]?transactions["`]?\s*;?$/i.test(sql.trim())) {
              injected = true;
              throw new Error('Injected rebuild failure');
            }
            return result;
          },
        }),
      ),
  };
  await expect(migrateDatabase(failing)).rejects.toThrow(
    'Injected rebuild failure',
  );
  expect(injected).toBe(true);
  expect((await db.execute('PRAGMA user_version')).rows).toEqual([
    { user_version: 3 },
  ]);
  expect(
    (await db.execute('SELECT * FROM transactions ORDER BY id')).rows,
  ).toEqual(rows);
  expect(
    (
      await db.execute(
        'SELECT type, name, sql FROM sqlite_master ORDER BY name',
      )
    ).rows,
  ).toEqual(original);
  await migrateDatabase(db);
});

test('v4 SQL constraints reject invalid arithmetic and fractional or negative tips', async () => {
  await migrateDatabase(db);
  const sql = 'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  for (const [change, tip, net] of [
    [2500, 500, 2500],
    [3000, 0, 2000],
    [0, 3000, 5000],
  ]) {
    await db.execute(sql, [
      randomUUID(),
      'uber',
      2000,
      5000,
      change,
      tip,
      net,
      '2026-10-01T10:00:00Z',
      null,
    ]);
  }
  for (const [change, tip, net] of [
    [2501, 500, 2500],
    [2500, 500, 2501],
    [3001, -1, 1999],
    [-1, 3001, 5001],
    [2499.5, 500.5, 2500.5],
  ]) {
    await expect(
      db.execute(sql, [
        randomUUID(),
        'uber',
        2000,
        5000,
        change,
        tip,
        net,
        '2026-10-01T10:00:00Z',
        null,
      ]),
    ).rejects.toThrow();
  }
  expect((await db.execute('SELECT * FROM transactions')).rows).toHaveLength(3);
});
