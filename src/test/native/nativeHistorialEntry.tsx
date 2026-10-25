// Device acceptance entry: actual App/UI/services, separate disposable database.
// Production index.js never imports this file or installs example operations.
import 'react-native-get-random-values';
import React from 'react';
import { AppRegistry, Dimensions, Linking, StyleSheet } from 'react-native';
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
import { typography } from '../../constants/theme/tokens';
import { platforms } from '../../constants/platforms';

// Only this disposable entry can simulate enlarged text without changing the OS.
function simulateFontScale(fontScale: number) {
  const appTextModule: typeof import('../../ui/AppText/AppText') = require('../../ui/AppText/AppText');
  const OriginalAppText = appTextModule.AppText;
  appTextModule.AppText = function AcceptanceText(props) {
    if (props.allowFontScaling === false) {
      return <OriginalAppText {...props} />;
    }
    const textStyle = StyleSheet.flatten(props.style);
    const fontSize = textStyle?.fontSize ?? typography[props.variant ?? 'body'];
    return (
      <OriginalAppText
        {...props}
        allowFontScaling={false}
        style={[props.style, { fontSize: fontSize * fontScale }]}
      />
    );
  };
  Dimensions.set({
    window: { ...Dimensions.get('window'), fontScale },
    screen: { ...Dimensions.get('screen'), fontScale },
  });
}

const manager = createDatabaseManager(() =>
  open({ name: 'cash-driver-historial-test.sqlite' }),
);
const ready = manager.initialize().then(async db => {
  const url = (await Linking.getInitialURL()) ?? '';
  const language = url.includes('language=en') ? 'en' : 'es';
  if (url.includes('large=1')) simulateFontScale(1.8);
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
    for (let index = 0; index < 56; index++) {
      const platform = platforms[index % platforms.length];
      timestamp = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        18,
        -index * 5,
      );
      await services.transactions.save(
        services.transactions.newPendingOperation(),
        {
          platform,
          fareAmountCents: index === 0 ? 999999 : 1400 + index,
          cashReceivedCents: index === 0 ? 999999 : 2000 + index,
          tipCents: index !== 0 && index % 2 === 0 ? 200 : 0,
        },
      );
    }
    timestamp = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      12,
    );
    await services.transactions.save(
      services.transactions.newPendingOperation(),
      {
        platform: 'cabify',
        fareAmountCents: 1250,
        cashReceivedCents: 2000,
        tipCents: 150,
      },
    );
    timestamp = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12);
    await services.transactions.save(
      services.transactions.newPendingOperation(),
      {
        platform: 'bolt',
        fareAmountCents: 980,
        cashReceivedCents: 1000,
        tipCents: 0,
      },
    );
  }
  timestamp = null;
  await services.preferences.update({
    language,
    themeMode: url.includes('theme=dark') ? 'dark' : 'light',
    hapticsEnabled: false,
    soundEnabled: false,
  });
  return services;
});
const initialize = () => ready;
function NativeHistorialAcceptance() {
  return <App initialize={initialize} />;
}
AppRegistry.registerComponent(appName, () => NativeHistorialAcceptance);
