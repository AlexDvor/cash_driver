// Explicit acceptance-only entry. Never imported by the production app.
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import {
  AppRegistry,
  Button,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { open } from '@op-engineering/op-sqlite';
import { v4 as uuid } from 'uuid';
import App from '../../../App';
import { name as appName } from '../../../app.json';
import { createDatabaseManager } from '../../database/connection';
import { createChangeNotifier } from '../../app/changeNotifier';
import { createTransactionRepository } from '../../features/transactions/transactionRepository';
import { createTransactionService } from '../../features/transactions/transactionService';
import { createPreferencesRepository } from '../../features/settings/preferencesRepository';
import { createPreferencesService } from '../../features/settings/preferencesService';
import { Persistence } from '../../app/persistence';
import { seedVolumeFixture, threeYearFixture } from '../threeYearFixture';
import { verifyThreeYearVolume } from '../threeYearChecks';
import { verifyLegacyMigrations } from '../legacyMigrationChecks';

const packageId = 'com.alexm.cashdriver.acceptance';
const started = performance.now();
const fixtureReady = (async () => {
  if (NativeModules.CashDriverAppVersion?.applicationId !== packageId) {
    throw new Error('Acceptance package guard failed; no database opened');
  }
  const reports = [];
  const migrations = await verifyLegacyMigrations(version =>
    open({ name: `cash-driver-acceptance-migration-${version}.sqlite` }),
  );
  const scenarios: { name: string; services: Persistence }[] = [];
  for (const [name, count] of [
    ['empty', 0],
    ['small', 100],
    ['large', 109600],
  ] as const) {
    const databaseName = `cash-driver-acceptance-${name}.sqlite`;
    if (!databaseName.startsWith('cash-driver-acceptance-'))
      throw new Error('Database guard failed');
    const db = await createDatabaseManager(() =>
      open({ name: databaseName }),
    ).initialize();
    const stored = await db.execute(
      'SELECT COUNT(*) AS count FROM transactions',
    );
    const options = { ...threeYearFixture, count };
    const seedStart = performance.now();
    if (stored.rows[0].count === 0 && count)
      await seedVolumeFixture(db, options);
    const seedMs = performance.now() - seedStart;
    const report = await verifyThreeYearVolume(db, options);
    const changes = createChangeNotifier();
    const services: Persistence = {
      changes,
      preferences: createPreferencesService(
        createPreferencesRepository(db),
        changes,
      ),
      transactions: createTransactionService(
        createTransactionRepository(db),
        changes,
        uuid,
        () => new Date(),
      ),
    };
    const before = await db.execute(
      'SELECT COUNT(*) AS count FROM transactions',
    );
    const pending = services.transactions.newPendingOperation();
    const input = {
      platform: 'uber' as const,
      fareAmountCents: 1800,
      cashReceivedCents: 2000,
      tipCents: 100,
    };
    const saved = await services.transactions.save(pending, input);
    await services.transactions.save(pending, input);
    const after = await db.execute(
      'SELECT COUNT(*) AS count FROM transactions',
    );
    if (
      Number(after.rows[0].count) !== Number(before.rows[0].count) + 1 ||
      saved.changeGivenCents !== 100
    )
      throw new Error('Native commit/idempotency failure');
    const edited = await services.transactions.edit(saved.id, {
      ...input,
      fareAmountCents: 1700,
      tipCents: 50,
    });
    if (
      edited.createdAt !== saved.createdAt ||
      edited.updatedAt === null ||
      edited.changeGivenCents !== 250
    )
      throw new Error('Native edit failed');
    await services.transactions.remove(saved.id);
    await db.execute(
      "CREATE TEMP TRIGGER acceptance_reject BEFORE INSERT ON transactions BEGIN SELECT RAISE(ABORT, 'acceptance write failure'); END",
    );
    let failedWrite = false;
    try {
      await services.transactions.save(
        services.transactions.newPendingOperation(),
        input,
      );
    } catch {
      failedWrite = true;
    }
    await db.execute('DROP TRIGGER acceptance_reject');
    if (
      !failedWrite ||
      (await db.execute('SELECT COUNT(*) AS count FROM transactions')).rows[0]
        .count !== count
    )
      throw new Error('Native failure preservation failed');
    reports.push({ name, seedMs, ...report });
    console.info(
      'FINAL_ACCEPTANCE_SCENARIO',
      JSON.stringify({ name, seedMs, ...report }),
    );
    scenarios.push({ name, services });
  }
  console.info(
    'FINAL_ACCEPTANCE_PASS',
    JSON.stringify({
      readyMs: performance.now() - started,
      migrations,
      counts: reports.map(report => report.count),
    }),
  );
  return { reports, scenarios };
})();

const styles = StyleSheet.create({ report: { padding: 24 } });
function FinalAcceptance() {
  const [result, setResult] = useState<Awaited<typeof fixtureReady> | null>(
    null,
  );
  const [failure, setFailure] = useState(
    'Seeding / checking isolated databases…',
  );
  const [selected, setSelected] = useState<Persistence | null>(null);
  useEffect(() => {
    let active = true;
    fixtureReady
      .then(value => {
        if (active) setResult(value);
      })
      .catch(error => {
        console.error('FINAL_ACCEPTANCE_FAIL', String(error));
        if (active) setFailure(String(error));
      });
    return () => {
      active = false;
    };
  }, []);
  if (selected) return <App initialize={() => Promise.resolve(selected)} />;
  return (
    <ScrollView contentContainerStyle={styles.report}>
      <Text selectable>
        {result
          ? `PASS: ${result.reports
              .map(report => `${report.name}: ${report.count} rows`)
              .join(', ')}`
          : failure}
      </Text>
      {result?.scenarios.map(scenario => (
        <Button
          key={scenario.name}
          title={`Open ${scenario.name} isolated app`}
          onPress={() => setSelected(scenario.services)}
        />
      ))}
    </ScrollView>
  );
}
AppRegistry.registerComponent(appName, () => FinalAcceptance);
