// Phase 8 only: native SQL failures and fixed-date checks on a disposable DB.
// Production index.js never imports this entry; no fixture payments are seeded.
import 'react-native-get-random-values';
import React from 'react';
import { AppRegistry } from 'react-native';
import { open } from '@op-engineering/op-sqlite';
import { v4 as uuid } from 'uuid';
import App from '../App';
import { name as appName } from '../app.json';
import { createDatabaseManager } from '../src/database/connection';
import { SqlConnection, SqlExecutor, SqlValue } from '../src/database/sqlite';
import { createChangeNotifier } from '../src/app/changeNotifier';
import { createTransactionRepository } from '../src/features/transactions/transactionRepository';
import { createTransactionService } from '../src/features/transactions/transactionService';
import { createPreferencesRepository } from '../src/features/settings/preferencesRepository';
import { createPreferencesService } from '../src/features/settings/preferencesService';
import { getPeriodBounds } from '../src/features/summary/periods';

const manager = createDatabaseManager(() =>
  open({ name: 'cash-driver-ajustes-test.sqlite' }),
);
const ready = manager.initialize().then(async db => {
  const shortDay = getPeriodBounds(
    new Date('2026-03-29T12:00:00Z'),
    'day',
    'Europe/Madrid',
  );
  const longDay = getPeriodBounds(
    new Date('2026-10-25T12:00:00Z'),
    'day',
    'Europe/Madrid',
  );
  const week = getPeriodBounds(
    new Date('2026-01-01T12:00:00Z'),
    'week',
    'Europe/Madrid',
  );
  const month = getPeriodBounds(
    new Date('2024-02-29T12:00:00Z'),
    'month',
    'Europe/Madrid',
  );
  if (
    shortDay.end.getTime() - shortDay.start.getTime() !== 23 * 3600000 ||
    longDay.end.getTime() - longDay.start.getTime() !== 25 * 3600000 ||
    week.start.toISOString() !== '2025-12-28T23:00:00.000Z' ||
    week.end.toISOString() !== '2026-01-04T23:00:00.000Z' ||
    month.end.toISOString() !== '2024-02-29T23:00:00.000Z'
  ) {
    throw new Error('Native calendar acceptance failed');
  }
  console.info(
    'PHASE8 NATIVE CALENDAR PASS: DST 23/25h, Monday/year, leap month',
  );
  const bindings = await db.execute(
    'SELECT typeof(fare_amount_cents) AS fare, typeof(cash_received_cents) AS cash, typeof(tip_cents) AS tip FROM transactions',
  );
  if (
    bindings.rows.some(row =>
      Object.values(row).some(value => value !== 'integer'),
    )
  ) {
    throw new Error('Native integer bindings failed');
  }
  console.info('PHASE8 NATIVE INTEGER CHECK', bindings.rows.length);
  // Fail writes once using an actual native query error. Keep list reads failing
  // through incidental focus/resume refreshes until a preference write succeeds.
  const failures = new Set([
    'SELECT * FROM preferences WHERE id = 1',
    'SELECT * FROM transactions ORDER BY',
    'INSERT INTO transactions',
    'UPDATE transactions SET',
    'UPDATE preferences SET',
    'DELETE FROM transactions WHERE id = ?',
    'DELETE FROM transactions',
  ]);
  function execute(executor: SqlExecutor, sql: string, params?: SqlValue[]) {
    const failure = [...failures].find(prefix =>
      prefix === 'DELETE FROM transactions'
        ? sql === prefix
        : sql.startsWith(prefix),
    );
    if (failure) {
      if (failure !== 'SELECT * FROM transactions ORDER BY') {
        failures.delete(failure);
      }
      console.info('PHASE8 INJECTED NATIVE QUERY FAILURE', failure);
      return executor.execute(
        'SELECT * FROM deliberately_missing_phase8_table',
      );
    }
    return executor.execute(sql, params).then(result => {
      if (sql.startsWith('UPDATE preferences SET')) {
        failures.delete('SELECT * FROM transactions ORDER BY');
      }
      return result;
    });
  }
  const checked: SqlConnection = {
    ...db,
    execute: (sql, params) => execute(db, sql, params),
    transaction: work =>
      db.transaction(tx =>
        work({
          execute: (sql, params) => execute(tx, sql, params),
        }),
      ),
  };
  const changes = createChangeNotifier();
  return {
    changes,
    preferences: createPreferencesService(
      createPreferencesRepository(checked),
      changes,
    ),
    transactions: createTransactionService(
      createTransactionRepository(checked),
      changes,
      uuid,
      () => new Date(),
    ),
  };
});
const initialize = () => ready;
AppRegistry.registerComponent(appName, () => () => (
  <App initialize={initialize} />
));
