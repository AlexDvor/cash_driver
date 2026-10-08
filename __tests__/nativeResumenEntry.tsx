// Device acceptance only: production index.js never imports this fixture.
import 'react-native-get-random-values';
import React from 'react';
import { AppRegistry } from 'react-native';
import { open } from '@op-engineering/op-sqlite';
import { v4 as uuid } from 'uuid';
import App from '../App';
import { name as appName } from '../app.json';
import { createDatabaseManager } from '../src/database/connection';
import { createChangeNotifier } from '../src/app/changeNotifier';
import { createTransactionRepository } from '../src/features/transactions/transactionRepository';
import { createTransactionService } from '../src/features/transactions/transactionService';
import { createPreferencesRepository } from '../src/features/settings/preferencesRepository';
import { createPreferencesService } from '../src/features/settings/preferencesService';
import { getPeriodBounds } from '../src/features/summary/periods';

const manager = createDatabaseManager(() =>
  open({ name: 'cash-driver-resumen-test.sqlite' }),
);
const ready = manager.initialize().then(async db => {
  const changes = createChangeNotifier();
  let timestamp: Date | null = null;
  const services = {
    changes,
    preferences: createPreferencesService(
      createPreferencesRepository(db),
      changes,
    ),
    transactions: createTransactionService(
      createTransactionRepository(db),
      changes,
      uuid,
      () => timestamp ?? new Date(),
    ),
  };
  if ((await services.transactions.list()).length === 0) {
    const now = new Date();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (const platform of ['uber', 'cabify', 'bolt', 'other'] as const) {
      timestamp = now;
      await services.transactions.save(
        services.transactions.newPendingOperation(),
        {
          platform,
          fareAmountCents: platform === 'cabify' ? 1501 : 1000,
          cashReceivedCents: 2000,
          changeAsTip: platform === 'cabify',
        },
      );
    }
    // Additional saved rows outside the current day/week, only in this database.
    for (const period of ['day', 'week', 'month'] as const) {
      timestamp = new Date(
        getPeriodBounds(now, period, zone).start.getTime() - 1,
      );
      await services.transactions.save(
        services.transactions.newPendingOperation(),
        {
          platform: 'uber',
          fareAmountCents: 500,
          cashReceivedCents: 500,
          changeAsTip: false,
        },
      );
    }
  }
  timestamp = null;
  return services;
});
const initialize = () => ready;
function NativeResumenAcceptance() {
  return <App initialize={initialize} />;
}
AppRegistry.registerComponent(appName, () => NativeResumenAcceptance);
