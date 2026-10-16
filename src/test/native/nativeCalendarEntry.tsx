// Device-only embedded acceptance APK in com.tempapp.calendartest. Never import
// from production index.js; all fixtures live in this test package's own storage.
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppRegistry, Button, ScrollView, Text } from 'react-native';
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
import { seedCalendarVolume } from '../calendarVolumeFixture';
import { verifyCalendarVolume } from '../calendarNativeChecks';
import { Persistence } from '../../app/persistence';

const ready = (async () => {
  const manager = createDatabaseManager(() =>
    open({ name: 'calendar-phase6-fixture.sqlite' }),
  );
  const db = await manager.initialize();
  if (!(await createTransactionRepository(db).hasAny())) {
    await seedCalendarVolume(db);
  }
  const observations = await verifyCalendarVolume(db);
  console.info('CALENDAR_PHASE6_NATIVE_PASS', JSON.stringify(observations));
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
  function failFirstRead<A extends unknown[], R>(
    read: (...args: A) => Promise<R>,
  ) {
    let pending = true;
    return async (...args: A): Promise<R> => {
      if (pending) {
        pending = false;
        await db.execute('SELECT * FROM calendar_phase6_missing_table');
      }
      return read(...args);
    };
  }
  const faultServices: Persistence = {
    ...services,
    transactions: {
      ...services.transactions,
      listPage: failFirstRead(services.transactions.listPage),
      summarize: failFirstRead(services.transactions.summarize),
      occupiedDates: failFirstRead(services.transactions.occupiedDates),
    },
  };
  return { observations, services, faultServices };
})();

function NativeCalendarAcceptance() {
  const [report, setReport] = useState('Calendar native acceptance running');
  const [services, setServices] = useState<Persistence | null>(null);
  const [faultServices, setFaultServices] = useState<Persistence | null>(null);
  const [showApp, setShowApp] = useState(false);
  useEffect(() => {
    let mounted = true;
    ready
      .then(result => {
        if (mounted) {
          setReport(JSON.stringify(result.observations, null, 2));
          setServices(result.services);
          setFaultServices(result.faultServices);
        }
      })
      .catch(error => {
        if (mounted) {
          setReport(`NATIVE FAIL: ${String(error)}`);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);
  if (showApp && services) {
    return <App initialize={() => Promise.resolve(services)} />;
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text selectable>{report}</Text>
      <Button
        title="Open isolated calendar app"
        disabled={!services}
        onPress={() => setShowApp(true)}
      />
      <Button
        title="Open with read failures"
        disabled={!faultServices}
        onPress={() => {
          setServices(faultServices);
          setShowApp(true);
        }}
      />
    </ScrollView>
  );
}
AppRegistry.registerComponent(appName, () => NativeCalendarAcceptance);
