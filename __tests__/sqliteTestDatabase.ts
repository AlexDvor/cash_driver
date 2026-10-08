/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import {
  SqlConnection,
  SqlExecutor,
  SqlResult,
  SqlValue,
} from '../src/database/sqlite';
import { migrateDatabase } from '../src/database/migrations';
import { serializeConnection } from '../src/database/serializedConnection';
import { createChangeNotifier } from '../src/app/changeNotifier';
import { createPreferencesRepository } from '../src/features/settings/preferencesRepository';
import { createPreferencesService } from '../src/features/settings/preferencesService';
import { createTransactionRepository } from '../src/features/transactions/transactionRepository';
import { createTransactionService } from '../src/features/transactions/transactionService';

// Real SQLite engine; only its asynchronous API shape is adapted for repositories.
export function openTestDatabase(path = ':memory:'): SqlConnection {
  const database = new DatabaseSync(path);
  const executor: SqlExecutor = {
    async execute(
      sql: string,
      parameters: SqlValue[] = [],
    ): Promise<SqlResult> {
      const statement = database.prepare(sql);
      if (statement.columns().length > 0) {
        return {
          rows: statement.all(...parameters).map(row => ({ ...row })),
          rowsAffected: 0,
        };
      }
      return {
        rows: [],
        rowsAffected: Number(statement.run(...parameters).changes),
      };
    },
  };
  return serializeConnection({
    execute: executor.execute,
    async transaction(work) {
      database.exec('BEGIN IMMEDIATE');
      try {
        await work(executor);
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => database.close(),
  });
}

export async function testPersistence(
  db: SqlConnection,
  now = () => new Date('2026-10-08T10:00:00Z'),
) {
  await migrateDatabase(db);
  const changes = createChangeNotifier();
  return {
    changes,
    preferences: createPreferencesService(
      createPreferencesRepository(db),
      changes,
    ),
    transactions: createTransactionService(
      createTransactionRepository(db),
      changes,
      randomUUID,
      now,
    ),
  };
}

export const validInput = {
  platform: 'uber',
  fareAmountCents: 1800,
  cashReceivedCents: 2000,
  changeAsTip: true,
} as const;
