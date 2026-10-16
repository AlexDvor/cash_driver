// Device acceptance only: production index.js never imports this fixture.
import 'react-native-get-random-values';
import React from 'react';
import { AppRegistry } from 'react-native';
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
import {
  getPeriodBounds,
  getCalendarMonthBounds,
} from '../../features/summary/periods';

const manager = createDatabaseManager(() =>
  open({ name: 'cash-driver-summary-acceptance.sqlite' }),
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
          tipCents: platform === 'cabify' ? 499 : 0,
        },
      );
    }
    // Large values are acceptance-only records in this separate test package/database.
    for (const platform of ['uber', 'cabify', 'bolt', 'other'] as const) {
      timestamp = now;
      await services.transactions.save(
        services.transactions.newPendingOperation(),
        {
          platform,
          fareAmountCents: 999999,
          cashReceivedCents: 999999,
          tipCents: 0,
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
          tipCents: 0,
        },
      );
    }
  }
  timestamp = null;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayBounds = getPeriodBounds(new Date(), 'day', zone);
  const delayedStart = getCalendarMonthBounds(
    { year: 2025, month: 5 },
    zone,
  ).start.getTime();
  const errorStart = getCalendarMonthBounds(
    { year: 2025, month: 6 },
    zone,
  ).start.getTime();
  const counts = new Map<string, number>();
  let activityFailed = false;
  return {
    ...services,
    transactions: {
      ...services.transactions,
      async summarize(
        bounds: Parameters<typeof services.transactions.summarize>[0],
      ) {
        const start = bounds.start.getTime();
        const key = `${start}/${bounds.end.getTime()}`;
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        if (
          (start === errorStart && count === 1) ||
          (start === todayBounds.start.getTime() &&
            bounds.end.getTime() === todayBounds.end.getTime() &&
            count === 2)
        ) {
          throw Error('Acceptance-only summary read failure');
        }
        if (start === delayedStart && count === 1) {
          await new Promise<void>(resolve => setTimeout(resolve, 8000));
        }
        return services.transactions.summarize(bounds);
      },
      async occupiedDates(
        ...args: Parameters<typeof services.transactions.occupiedDates>
      ) {
        if (args[0].year === 2025 && args[0].month === 4 && !activityFailed) {
          activityFailed = true;
          throw Error('Acceptance-only activity read failure');
        }
        return services.transactions.occupiedDates(...args);
      },
    },
  };
});
const initialize = () => ready;
function NativeSummaryAcceptance() {
  return <App initialize={initialize} />;
}
AppRegistry.registerComponent(appName, () => NativeSummaryAcceptance);
