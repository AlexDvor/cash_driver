// Device acceptance entry: actual App/UI/services, separate disposable database.
// Production index.js never imports this file or installs example operations.
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

const manager = createDatabaseManager(() =>
  open({ name: 'cash-driver-historial-test.sqlite' }),
);
const ready = manager.initialize().then(async db => {
  const changes = createChangeNotifier();
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
      () => new Date(),
    ),
  };
  if ((await services.transactions.list()).length === 0) {
    for (const platform of ['uber', 'cabify', 'bolt'] as const) {
      await services.transactions.save(
        services.transactions.newPendingOperation(),
        {
          platform,
          fareAmountCents: 1800,
          cashReceivedCents: 2000,
          changeAsTip: platform === 'cabify',
        },
      );
    }
  }
  return services;
});
const initialize = () => ready;
function NativeHistorialAcceptance() {
  return <App initialize={initialize} />;
}
AppRegistry.registerComponent(appName, () => NativeHistorialAcceptance);
