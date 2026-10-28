import {
  migrateDatabase,
  transactionSchema,
  SCHEMA_VERSION,
} from '../database/migrations';
import { SqlConnection } from '../database/sqlite';
import { createTransactionRepository } from '../features/transactions/transactionRepository';

// Historical synthetic schemas only; caller must provide isolated test connections.
export async function verifyLegacyMigrations(
  openIsolated: (version: number) => SqlConnection,
) {
  const versions = [1, 3, 4, 5, 6];
  for (const version of versions) {
    const db = openIsolated(version);
    try {
      await db.execute('DROP TABLE IF EXISTS preference_enabled_platforms');
      await db.execute('DROP TABLE IF EXISTS preferences');
      await db.execute('DROP TABLE IF EXISTS transactions');
      await db.execute(
        version < 4
          ? transactionSchema
          : transactionSchema.replace(
              ',\n  CHECK (tip_cents = 0 OR change_given_cents = 0)',
              '',
            ),
      );
      await db.execute(
        'CREATE INDEX transactions_created_at_idx ON transactions(created_at)',
      );
      await db.execute(
        'CREATE INDEX transactions_platform_created_at_idx ON transactions(platform, created_at)',
      );
      await db.execute(
        "INSERT INTO transactions VALUES ('migration-preserved','uber',1800,2000,0,200,2000,'2024-02-29T12:00:00.000Z',NULL)",
      );
      if (version >= 3) {
        await db.execute(
          `CREATE TABLE preferences (id INTEGER PRIMARY KEY CHECK(id=1), language TEXT NOT NULL, theme_mode TEXT NOT NULL, default_platform TEXT NOT NULL, haptics_enabled INTEGER${
            version >= 6 ? ', sound_enabled INTEGER NOT NULL DEFAULT 1' : ''
          })`,
        );
        await db.execute(
          "INSERT INTO preferences (id,language,theme_mode,default_platform,haptics_enabled) VALUES (1,'uk','dark','bolt',1)",
        );
      }
      if (version >= 5) {
        await db.execute(
          'CREATE TABLE preference_enabled_platforms (preference_id INTEGER NOT NULL, platform TEXT NOT NULL, PRIMARY KEY(preference_id,platform))',
        );
        await db.execute(
          "INSERT INTO preference_enabled_platforms VALUES (1,'bolt')",
        );
      }
      await db.execute(`PRAGMA user_version = ${version}`);
      let rejected = false;
      try {
        await migrateDatabase({
          ...db,
          transaction: work =>
            db.transaction(tx =>
              work({
                execute: (sql, params) => {
                  if (sql.includes("WHERE language = 'uk'"))
                    throw new Error('Injected migration failure');
                  return tx.execute(sql, params);
                },
              }),
            ),
        });
      } catch {
        rejected = true;
      }
      if (
        !rejected ||
        (await db.execute('PRAGMA user_version')).rows[0].user_version !==
          version
      )
        throw new Error('Migration rollback failed');
      await migrateDatabase(db);
      const row = await createTransactionRepository(db).get(
        'migration-preserved',
      );
      const prefs = (await db.execute('SELECT * FROM preferences')).rows[0];
      if (
        (await db.execute('PRAGMA user_version')).rows[0].user_version !==
          SCHEMA_VERSION ||
        row?.fareAmountCents !== 1800 ||
        row.tipCents !== 200 ||
        prefs.language !== 'es' ||
        (version >= 3 && prefs.theme_mode !== 'dark')
      )
        throw new Error('Migration preservation failed');
    } finally {
      db.close();
    }
  }
  return versions;
}
