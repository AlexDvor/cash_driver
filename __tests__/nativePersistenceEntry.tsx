// Device-only test entry. Never imported by index.js; fixtures use a separate DB.
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppRegistry, Text, View } from 'react-native';
import { open } from '@op-engineering/op-sqlite';
import { v4 as uuid } from 'uuid';
import { createDatabaseManager } from '../src/database/connection';
import { createChangeNotifier } from '../src/app/changeNotifier';
import { migrateDatabase, transactionSchema } from '../src/database/migrations';
import { createTransactionRepository } from '../src/features/transactions/transactionRepository';
import { createTransactionService } from '../src/features/transactions/transactionService';
import { createPreferencesRepository } from '../src/features/settings/preferencesRepository';
import { createPreferencesService } from '../src/features/settings/preferencesService';
import { name as appName } from '../app.json';

function check(condition: boolean, description: string) {
  if (!condition) {
    throw new Error(description);
  }
}

const manager = createDatabaseManager(() =>
  open({ name: 'cash-driver-native-test.sqlite' }),
);
async function verifyNativePersistence(): Promise<string> {
  const [db, same] = await Promise.all([
    manager.initialize(),
    manager.initialize(),
  ]);
  check(db === same, 'Singleton initialization');
  const changes = createChangeNotifier();
  const preferences = createPreferencesService(
    createPreferencesRepository(db),
    changes,
  );
  const transactions = createTransactionService(
    createTransactionRepository(db),
    changes,
    uuid,
    () => new Date('2026-10-08T10:00:00Z'),
  );
  const settings = await preferences.read();
  const rows = await transactions.list();
  const input = {
    platform: 'cabify',
    fareAmountCents: 1850,
    cashReceivedCents: 2000,
    tipCents: 150,
  } as const;
  if (!settings.hapticsEnabled) {
    check(rows.length === 0, 'Fixture DB must start empty');
    const pending = transactions.newPendingOperation();
    const [first, second] = await Promise.all([
      transactions.save(pending, input),
      transactions.save(pending, input),
    ]);
    check(
      first.id === second.id && (await transactions.list()).length === 1,
      'Duplicate protection',
    );
    check(
      (await transactions.save(pending, input)).id === pending.id,
      'Committed retry',
    );
    const bindings = await db.execute(
      'SELECT typeof(fare_amount_cents) AS fare, typeof(cash_received_cents) AS received, typeof(change_given_cents) AS change, typeof(tip_cents) AS tip, typeof(net_cash_cents) AS net FROM transactions',
    );
    check(
      Object.values(bindings.rows[0]).every(value => value === 'integer'),
      'Native integer bindings',
    );
    let rejectedFraction = false;
    try {
      await db.execute(
        'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuid(), 'uber', 0.5, 1.5, 1, 0, 0.5, first.createdAt, null],
      );
    } catch {
      rejectedFraction = true;
    }
    check(rejectedFraction, 'Native fractional constraint');
    let notifications = 0;
    const unsubscribe = changes.subscribe(() => {
      notifications++;
    });
    const failingConnection = {
      ...db,
      transaction: (work: Parameters<typeof db.transaction>[0]) =>
        db.transaction(async tx => {
          await work(tx);
          throw new Error('Simulated failed commit');
        }),
    };
    const failingService = createTransactionService(
      createTransactionRepository(failingConnection),
      changes,
      uuid,
      () => new Date(),
    );
    const retry = failingService.newPendingOperation();
    let failed = false;
    try {
      await failingService.save(retry, input);
    } catch {
      failed = true;
    }
    check(
      failed && notifications === 0 && (await transactions.list()).length === 1,
      'Native rollback without notification',
    );
    await transactions.save(retry, input);
    check(
      notifications === 1 && (await transactions.list()).length === 2,
      'Native retry after rollback',
    );
    await transactions.remove(retry.id);
    unsubscribe();
    const migration = open({
      name: 'cash-driver-native-migration-test.sqlite',
    });
    try {
      await migration.execute(transactionSchema);
      await migration.execute(
        'INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuid(), 'uber', 999999, 999999, 0, 0, 999999, first.createdAt, null],
      );
      await migration.execute('PRAGMA user_version = 1');
      await migrateDatabase(migration);
      check(
        (await createTransactionRepository(migration).list())[0]
          .fareAmountCents === 999999,
        'Native migration preserves cents',
      );
    } finally {
      // This is a disposable test fixture, never the application database.
      migration.delete();
    }
    await preferences.update({
      language: 'uk',
      themeMode: 'dark',
      defaultPlatform: 'bolt',
      hapticsEnabled: true,
    });
    return 'NATIVE FIRST PASS: integer bindings, constraints, migration, retry, rollback; force-stop and relaunch';
  }
  check(
    settings.language === 'uk' &&
      settings.themeMode === 'dark' &&
      settings.defaultPlatform === 'bolt' &&
      settings.hapticsEnabled === true,
    'Preferences survive process restart',
  );
  check(
    rows.length === 1 &&
      rows[0].fareAmountCents === 1850 &&
      rows[0].tipCents === 150,
    'Operation survives process restart',
  );
  const edited = await transactions.edit(rows[0].id, {
    ...input,
    tipCents: 0,
  });
  check(
    edited.createdAt === rows[0].createdAt &&
      edited.updatedAt !== null &&
      edited.changeGivenCents === 150,
    'Native edit preserves creation time',
  );
  await transactions.remove(rows[0].id);
  check((await transactions.list()).length === 0, 'Native delete');
  await preferences.update({
    language: 'es',
    themeMode: 'system',
    defaultPlatform: 'uber',
    hapticsEnabled: false,
  });
  return 'NATIVE RESTART PASS: operations/preferences restored, edit/date preserved, delete';
}

function NativePersistenceCheck() {
  const [status, setStatus] = useState('Native persistence check running');
  useEffect(() => {
    let mounted = true;
    verifyNativePersistence()
      .then(result => {
        console.log(result);
        if (mounted) {
          setStatus(result);
        }
      })
      .catch(error => {
        const result = `NATIVE FAIL: ${String(error)}`;
        console.error(result);
        if (mounted) {
          setStatus(result);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text>{status}</Text>
    </View>
  );
}
AppRegistry.registerComponent(appName, () => NativePersistenceCheck);
