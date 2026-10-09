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
  open({ name: 'cash-driver-ajustes-test.sqlite' }),
);
const ready = manager.initialize().then(db => {
  try {
    const feedback: typeof import('react-native-haptic-feedback') = require('react-native-haptic-feedback');
    console.info('PHASE8 HAPTICS supported', feedback.isSupported());
    feedback.getSystemHapticStatus().then(
      status => console.info('PHASE8 HAPTICS system', JSON.stringify(status)),
      error => console.info('PHASE8 HAPTICS status error', String(error)),
    );
  } catch (error) {
    console.info('PHASE8 HAPTICS module error', String(error));
  }
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
      uuid,
      () => new Date(),
    ),
  };
});
const initialize = () => ready;
function NativeAjustesAcceptance() {
  return <App initialize={initialize} />;
}
AppRegistry.registerComponent(appName, () => NativeAjustesAcceptance);
