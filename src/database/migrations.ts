import { SqlConnection } from './sqlite';
import { DEFAULT_HAPTICS_ENABLED } from '../features/settings/settingsDefaults';

export const SCHEMA_VERSION = 4;

// Version 1 is the documented transaction schema, with explicit SQLite type
// and input-bound checks so INTEGER affinity cannot silently accept fractions.
export const transactionSchema = `CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('uber','cabify','bolt','other')),
  fare_amount_cents INTEGER NOT NULL CHECK (typeof(fare_amount_cents) = 'integer' AND fare_amount_cents BETWEEN 1 AND 999999),
  cash_received_cents INTEGER NOT NULL CHECK (typeof(cash_received_cents) = 'integer' AND cash_received_cents BETWEEN 0 AND 999999),
  change_given_cents INTEGER NOT NULL CHECK (typeof(change_given_cents) = 'integer' AND change_given_cents >= 0),
  tip_cents INTEGER NOT NULL DEFAULT 0 CHECK (typeof(tip_cents) = 'integer' AND tip_cents >= 0),
  net_cash_cents INTEGER NOT NULL CHECK (typeof(net_cash_cents) = 'integer' AND net_cash_cents >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  CHECK (cash_received_cents >= fare_amount_cents),
  CHECK (change_given_cents = cash_received_cents - fare_amount_cents - tip_cents),
  CHECK (net_cash_cents = fare_amount_cents + tip_cents),
  CHECK (tip_cents = 0 OR change_given_cents = 0)
)`;

// Keep the historical v1 schema intact; v4 removes only the full-change rule.
const partialTipTransactionSchema = transactionSchema
  .replace('CREATE TABLE transactions (', 'CREATE TABLE transactions_v4 (')
  .replace(',\n  CHECK (tip_cents = 0 OR change_given_cents = 0)', '');

export async function migrateDatabase(db: SqlConnection): Promise<void> {
  const integrity = await db.execute('PRAGMA quick_check');
  if (integrity.rows.length !== 1 || integrity.rows[0].quick_check !== 'ok') {
    throw new Error('Database integrity check failed');
  }
  await db.transaction(async tx => {
    const result = await tx.execute('PRAGMA user_version');
    const version = result.rows[0]?.user_version;
    if (
      typeof version !== 'number' ||
      !Number.isInteger(version) ||
      version < 0 ||
      version > SCHEMA_VERSION
    ) {
      throw new Error('Unsupported database schema version');
    }
    if (version < 1) {
      await tx.execute(transactionSchema);
      await tx.execute(
        'CREATE INDEX transactions_created_at_idx ON transactions(created_at)',
      );
      await tx.execute(
        'CREATE INDEX transactions_platform_created_at_idx ON transactions(platform, created_at)',
      );
      await tx.execute('PRAGMA user_version = 1');
    }
    if (version < 2) {
      await tx.execute(`CREATE TABLE preferences (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        language TEXT NOT NULL CHECK (language IN ('es','en','uk')),
        theme_mode TEXT NOT NULL CHECK (theme_mode IN ('light','dark','system')),
        default_platform TEXT NOT NULL CHECK (default_platform IN ('uber','cabify','bolt','other')),
        haptics_enabled INTEGER CHECK (haptics_enabled IS NULL OR (typeof(haptics_enabled) = 'integer' AND haptics_enabled IN (0,1)))
      )`);
      // The initial haptics choice is NOT DOCUMENTED; NULL represents unset
      // until an owner decision, rather than guessing from the example image.
      await tx.execute(
        'INSERT INTO preferences (id, language, theme_mode, default_platform, haptics_enabled) VALUES (1, ?, ?, ?, ?)',
        ['es', 'system', 'uber', null],
      );
      await tx.execute('PRAGMA user_version = 2');
    }
    if (version < 3) {
      // Preserve explicit choices; resolve only the previous unset preference.
      await tx.execute(
        'UPDATE preferences SET haptics_enabled = ? WHERE haptics_enabled IS NULL',
        [Number(DEFAULT_HAPTICS_ENABLED)],
      );
      await tx.execute('PRAGMA user_version = 3');
    }
    if (version < 4) {
      await tx.execute(partialTipTransactionSchema);
      await tx.execute(`INSERT INTO transactions_v4
        (id, platform, fare_amount_cents, cash_received_cents, change_given_cents, tip_cents, net_cash_cents, created_at, updated_at)
        SELECT id, platform, fare_amount_cents, cash_received_cents, change_given_cents, tip_cents, net_cash_cents, created_at, updated_at FROM transactions`);
      await tx.execute('DROP TABLE transactions');
      await tx.execute('ALTER TABLE transactions_v4 RENAME TO transactions');
      await tx.execute(
        'CREATE INDEX transactions_created_at_idx ON transactions(created_at)',
      );
      await tx.execute(
        'CREATE INDEX transactions_platform_created_at_idx ON transactions(platform, created_at)',
      );
      await tx.execute('PRAGMA user_version = 4');
    }
    // Fail on missing tables even if user_version incorrectly claims readiness.
    await tx.execute(
      'SELECT id, platform, fare_amount_cents, cash_received_cents, change_given_cents, tip_cents, net_cash_cents, created_at, updated_at FROM transactions LIMIT 0',
    );
    await tx.execute(
      'SELECT language, theme_mode, default_platform, haptics_enabled FROM preferences WHERE id = 1',
    );
  });
}
