import React from 'react';
import { SummaryContent } from '../../components/SummaryMetrics/SummaryContent';
import { RetainedCashCard } from '../../components/SummaryMetrics/SummaryMetrics';
import { Alert, AppState, AppStateStatus, View } from 'react-native';
import { SkeletonText } from '../../ui/Skeleton/SkeletonText';
import { AppText } from '../../ui/AppText/AppText';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../../navigation/AppNavigator';
import { RootStackParamList } from '../../navigation/navigationTypes';
import {
  PersistenceProvider,
  usePersistence,
} from '../../providers/PersistenceProvider/PersistenceProvider';
import { Persistence } from '../../app/persistence';
import { LanguageProvider } from '../../providers/LanguageProvider/LanguageProvider';
import { ThemeProvider } from '../../providers/ThemeProvider/ThemeProvider';
import { SqlConnection } from '../../database/sqlite';
import {
  CashSummary,
  summarizeTransactions,
} from '../../features/summary/summary';
import { createTransactionRepository } from '../../features/transactions/transactionRepository';
import { DELETION_UNDO_SECONDS } from '../../features/transactions/deletionConstants';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from '../../test/sqliteTestDatabase';

let db: SqlConnection;
let services: Persistence;
let app: ReactTestRenderer.ReactTestRenderer;
let preferences: ReturnType<typeof usePersistence>;
let ref = createNavigationContainerRef<RootStackParamList>();
let zone: string;
const originalState = AppState.currentState;
function Probe() {
  preferences = usePersistence();
  return null;
}
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-08T10:00:00Z'));
  AppState.currentState = 'active';
  zone = 'UTC';
  const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  jest
    .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    .mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...resolvedOptions.call(this), timeZone: zone };
    });
  db = openTestDatabase();
  services = await testPersistence(db, () => new Date());
  ref = createNavigationContainerRef<RootStackParamList>();
});
afterEach(async () => {
  await act(async () => app?.unmount());
  db.close();
  AppState.currentState = originalState;
  jest.restoreAllMocks();
  jest.useRealTimers();
});
async function mount() {
  await act(async () => {
    app = ReactTestRenderer.create(
      <SafeAreaProvider>
        <PersistenceProvider initialize={async () => services}>
          <Probe />
          <LanguageProvider>
            <ThemeProvider>
              <AppNavigator navigationRef={ref} />
            </ThemeProvider>
          </LanguageProvider>
        </PersistenceProvider>
      </SafeAreaProvider>,
    );
  });
  await press('Resumen');
}
async function seed(
  date: string,
  input: Parameters<typeof services.transactions.save>[1] = validInput,
) {
  const now = new Date();
  jest.setSystemTime(new Date(date));
  const row = await services.transactions.save(
    services.transactions.newPendingOperation(),
    input,
  );
  jest.setSystemTime(now);
  return row;
}
async function press(label: string) {
  const matches = app.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel === label,
  );
  if (!matches.length) {
    throw Error(`Missing ${label}`);
  }
  await act(async () => {
    await matches[matches.length - 1].props.onPress();
  });
}
function text(id: string) {
  const matches = app.root.findAllByProps({ testID: id });
  const children = matches[matches.length - 1]?.props.children;
  return Array.isArray(children) ? children.join('') : String(children);
}
function content() {
  return JSON.stringify(app.toJSON());
}
function expectCount(count: number) {
  expect(text('summary-count')).toBe(`Operaciones: ${count}`);
}

test('genuine empty summary shows all zero metrics/platforms and its actual date', async () => {
  await mount();
  expect(content()).toContain('No hay operaciones en este período');
  expectCount(0);
  for (const id of [
    'fareTotal',
    'tipsTotal',
    'averageFare',
    'retained',
    'uber',
    'cabify',
    'bolt',
    'other',
  ]) {
    expect(text(`summary-${id}`)).toMatch(/0,00/);
  }
  expect(text('summary-range')).toContain('8 oct 2026');
});

test('saved platforms, tips and retained cash remain distinct, with fare-only average and language/theme independent selection', async () => {
  for (const [platform, fare] of [
    ['uber', 1000],
    ['cabify', 1501],
    ['bolt', 999],
    ['other', 2000],
  ] as const) {
    await seed('2026-10-08T08:00:00Z', {
      platform,
      fareAmountCents: fare,
      cashReceivedCents: 2000,
      tipCents: platform === 'cabify' ? 2000 - fare : 0,
    });
  }
  await mount();
  expectCount(4);
  expect(text('summary-fareTotal')).toMatch(/55,00/);
  expect(text('summary-tipsTotal')).toMatch(/4,99/);
  expect(text('summary-retained')).toMatch(/59,99/);
  expect(text('summary-averageFare')).toMatch(/13,75/);
  expect(text('summary-cabify')).toMatch(/15,01/);
  await press('Mes');
  for (const language of ['en', 'es'] as const) {
    await act(async () => {
      await preferences.updatePreferences({
        language,
        themeMode: language === 'es' ? 'dark' : 'light',
      });
    });
    expect(text('summary-fareTotal')).toMatch(/55[,.]00/);
    expect(text('summary-range')).toContain('2026');
    expect(text('summary-range')).toContain('31');
  }
  expectCount(4);
});

// Expected instants are fixed independently of the production boundary utility.
test.each([
  [
    'Hoy',
    '2026-03-29T10:00:00Z',
    'Europe/Madrid',
    '2026-03-28T23:00:00Z',
    '2026-03-29T22:00:00Z',
  ],
  [
    'Hoy',
    '2026-10-25T10:00:00Z',
    'Europe/Madrid',
    '2026-10-24T22:00:00Z',
    '2026-10-25T23:00:00Z',
  ],
  [
    'Semana',
    '2027-01-01T10:00:00Z',
    'Europe/Madrid',
    '2026-12-27T23:00:00Z',
    '2027-01-03T23:00:00Z',
  ],
  [
    'Semana',
    '2026-03-29T10:00:00Z',
    'Europe/Madrid',
    '2026-03-22T23:00:00Z',
    '2026-03-29T22:00:00Z',
  ],
  [
    'Mes',
    '2026-12-31T10:00:00Z',
    'Europe/Madrid',
    '2026-11-30T23:00:00Z',
    '2026-12-31T23:00:00Z',
  ],
  [
    'Mes',
    '2026-03-29T10:00:00Z',
    'Europe/Madrid',
    '2026-02-28T23:00:00Z',
    '2026-03-31T22:00:00Z',
  ],
])(
  '%s at %s uses local half-open boundaries across DST/year transitions',
  async (label, now, timeZone, start, end) => {
    zone = timeZone;
    jest.setSystemTime(new Date(now));
    await seed(new Date(new Date(start).getTime() - 1).toISOString());
    await seed(start, {
      ...validInput,
      fareAmountCents: 100,
      cashReceivedCents: 200,
      tipCents: 100,
    });
    await seed(new Date(new Date(end).getTime() - 1).toISOString(), {
      ...validInput,
      platform: 'cabify',
      fareAmountCents: 101,
      cashReceivedCents: 200,
      tipCents: 99,
    });
    await seed(end);
    await mount();
    await press(label);
    expectCount(2);
    expect(text('summary-fareTotal')).toMatch(/2,01/);
    expect(text('summary-averageFare')).toMatch(/1,01/);
    expect(text('summary-tipsTotal')).toMatch(/1,99/);
    expect(text('summary-retained')).toMatch(/4,00/);
  },
);

test('committed create/edit/delete refresh summary; edit still belongs to original date', async () => {
  const original = await seed('2026-10-08T08:00:00Z');
  await mount();
  let addedId = '';
  await act(async () => {
    addedId = (
      await services.transactions.save(
        services.transactions.newPendingOperation(),
        { ...validInput, platform: 'bolt', tipCents: 0 },
      )
    ).id;
  });
  expectCount(2);
  await act(async () => {
    await services.transactions.edit(original.id, {
      ...validInput,
      platform: 'cabify',
      fareAmountCents: 1900,
      tipCents: 100,
    });
  });
  expect(text('summary-fareTotal')).toMatch(/37,00/);
  expect(text('summary-cabify')).toMatch(/19,00/);
  expect(text('summary-tipsTotal')).toMatch(/1,00/);
  expect((await services.transactions.get(original.id))?.createdAt).toBe(
    original.createdAt,
  );
  await act(async () => {
    await services.transactions.remove(addedId);
  });
  expectCount(1);
});

test.each([
  ['Semana', '2027-01-03T23:59:59Z', '2027-01-04T00:00:00Z'],
  ['Mes', '2026-12-31T23:59:59Z', '2027-01-01T00:00:00Z'],
])(
  '%s refreshes at its next calendar boundary while focused',
  async (label, before, after) => {
    jest.setSystemTime(new Date(before));
    await seed(before);
    await mount();
    await press(label);
    expectCount(1);
    await act(async () => {
      jest.setSystemTime(new Date(after));
      jest.advanceTimersByTime(1000);
    });
    expectCount(0);
    expect(content()).toContain('No hay operaciones en este período');
  },
);

test.each(['success', 'error'])(
  'loading/retry and rapid period switches reject an obsolete %s',
  async outcome => {
    await seed('2026-10-01T08:00:00Z');
    await mount();
    const originalHero = app.root.findByType(RetainedCashCard);
    let resolve: (summary: CashSummary) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const old = new Promise<CashSummary>((ok, fail) => {
      resolve = ok;
      reject = fail;
    });
    const list = jest
      .spyOn(services.transactions, 'summarize')
      .mockImplementationOnce(() => old);
    await press('Semana');
    expect(content()).toContain('Cargando resumen');
    const loadingContent = app.root.findByType(SummaryContent);
    expect(loadingContent.props.summary).toBeNull();
    expect(app.root.findByType(RetainedCashCard)).toBe(originalHero);
    expect(text('summary-fareTotal')).toBe('undefined');
    await press('Mes');
    expect(app.root.findByType(SummaryContent)).toBe(loadingContent);
    expect(loadingContent.props.summary).not.toBeNull();
    expect(app.root.findByType(RetainedCashCard)).toBe(originalHero);
    expectCount(1);
    await act(async () => {
      if (outcome === 'success') {
        resolve(summarizeTransactions([]));
      } else {
        reject(Error('stale'));
      }
    });
    expectCount(1);
    list.mockRejectedValueOnce(Error('read failure'));
    await press('Hoy');
    expect(content()).toContain('No se pudo cargar el resumen');
    expect(app.root.findAllByType(SummaryContent)).toHaveLength(0);
    expect(text('summary-fareTotal')).toBe('undefined');
    expect(text('summary-count')).toBe('undefined');
    await press('Reintentar');
    expectCount(0);
  },
);

test('pending deletion and undo keep saved totals; failed delete keeps totals, retry commit refreshes', async () => {
  const row = await seed('2026-10-08T08:00:00Z', {
    ...validInput,
    fareAmountCents: 2000,
    cashReceivedCents: 5000,
    tipCents: 500,
  });
  await mount();
  const alert = jest.spyOn(Alert, 'alert');
  async function begin() {
    await act(async () => ref.navigate('Details', { id: row.id }));
    await press('Eliminar');
    await act(async () =>
      alert.mock.calls[alert.mock.calls.length - 1][2]
        ?.find(action => action.style === 'destructive')
        ?.onPress?.(),
    );
    await act(async () => ref.goBack());
  }
  await begin();
  expectCount(1);
  expect(text('summary-retained')).toMatch(/25,00/);
  expect(text('summary-tipsTotal')).toMatch(/5,00/);
  await press('Deshacer');
  expect(await services.transactions.get(row.id)).toEqual(row);
  expectCount(1);
  await db.execute(
    "CREATE TRIGGER reject_delete BEFORE DELETE ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  await begin();
  await act(async () => {
    jest.advanceTimersByTime(DELETION_UNDO_SECONDS * 1000);
  });
  expect(content()).toContain('No se pudo eliminar la operación');
  expectCount(1);
  expect(await services.transactions.get(row.id)).toEqual(row);
  expect(text('summary-retained')).toMatch(/25,00/);
  expect(text('summary-tipsTotal')).toMatch(/5,00/);
  await db.execute('DROP TRIGGER reject_delete');
  await press('Reintentar');
  expectCount(0);
  expect(text('summary-retained')).toMatch(/0,00/);
  expect(text('summary-tipsTotal')).toMatch(/0,00/);
});

test('focus, resume, local midnight and timezone changes reload persisted rows and clean subscriptions', async () => {
  const listeners = new Set<(state: AppStateStatus) => void>();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
    listeners.add(callback);
    return {
      remove: () => {
        listeners.delete(callback);
      },
    };
  });
  const row = await seed('2026-10-08T23:30:00Z');
  await mount();
  expectCount(1);
  zone = 'Europe/Madrid';
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expectCount(0); // Same instant belongs to tomorrow in Madrid.
  await act(async () => {
    jest.setSystemTime(new Date('2026-10-08T22:00:00Z'));
    jest.advanceTimersByTime(1000);
  });
  expectCount(1);
  await press('Inicio');
  await createTransactionRepository(db).remove(row.id); // No service notification.
  await press('Resumen');
  expectCount(0);
  await createTransactionRepository(db).create(row);
  expectCount(0);
  await act(async () => {
    listeners.forEach(callback => callback('background'));
  });
  await act(async () => {
    listeners.forEach(callback => callback('active'));
  });
  expectCount(1);
  await act(async () => {
    jest.setSystemTime(new Date('2026-10-09T22:00:00Z'));
    jest.advanceTimersByTime(1000);
  });
  expectCount(0);
  await act(async () => app.unmount());
  expect(listeners.size).toBe(0);
});

test('large saved totals stay complete across ES/EN and all branded platform rows preserve fare-only values', async () => {
  for (const platform of ['uber', 'cabify', 'bolt', 'other'] as const) {
    await seed('2026-10-08T08:00:00Z', {
      platform,
      fareAmountCents: 999999,
      cashReceivedCents: 999999,
      tipCents: 0,
    });
  }
  await mount();
  for (const language of ['es', 'en'] as const) {
    await act(async () => {
      await preferences.updatePreferences({
        language,
        themeMode: language === 'en' ? 'dark' : 'light',
      });
    });
    const digits = (id: string) => text(id).replace(/\D/g, '');
    expect(digits('summary-fareTotal')).toBe('3999996');
    expect(digits('summary-retained')).toBe('3999996');
    expect(digits('summary-averageFare')).toBe('999999');
    expect(digits('summary-tipsTotal')).toBe('000');
    for (const platform of ['uber', 'cabify', 'bolt', 'other']) {
      expect(digits(`summary-${platform}`)).toBe('999999');
    }
    expect(content()).toContain('Uber');
    expect(content()).toContain('Cabify');
    expect(content()).toContain('Bolt');
    expect(content()).toContain('Taxi');
  }
});

test('period loading preserves long hero sizing without presenting previous-period values', async () => {
  await seed('2026-10-08T08:00:00Z', {
    ...validInput,
    fareAmountCents: 999999,
    cashReceivedCents: 999999,
    tipCents: 0,
  });
  await mount();
  const hero = app.root.findByType(RetainedCashCard);
  const amount = hero.props.amount;
  const countLabel = hero.props.countLabel;
  await act(async () =>
    hero
      .findAllByType(View)
      .find(node => node.props.onLayout)
      ?.props.onLayout({ nativeEvent: { layout: { width: 320 } } }),
  );
  const originalMoney = hero
    .findAllByType(SkeletonText)
    .find(node => node.props.testID === 'summary-retained')!;
  const nativeMoney = originalMoney.findAllByType(AppText).slice(-1)[0];
  let resolve!: (summary: CashSummary) => void;
  jest.spyOn(services.transactions, 'summarize').mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      }),
  );
  await press('Semana');
  expect(hero.props.loading).toBe(true);
  expect(hero.props.amount).toBe(amount);
  expect(hero.props.countLabel).toBe(countLabel);
  expect(text('summary-retained')).toBe('undefined');
  expect(text('summary-count')).toBe('undefined');
  const money = hero
    .findAllByType(SkeletonText)
    .find(node => node.props.sizingText === amount)!;
  expect(money.props.adjustsFontSizeToFit).toBeUndefined();
  let scroll = money.parent;
  while (scroll && !scroll.props.horizontal) scroll = scroll.parent;
  expect(scroll?.props.horizontal).toBe(true);
  expect(money).toBe(originalMoney);
  expect(money.findAllByType(AppText).slice(-1)[0]).toBe(nativeMoney);
  await act(async () => resolve(summarizeTransactions([])));
  expectCount(0);
  expect(
    hero
      .findAllByType(SkeletonText)
      .find(node => node.props.testID === 'summary-retained'),
  ).toBe(originalMoney);
  expect(originalMoney.findAllByType(AppText).slice(-1)[0]).toBe(nativeMoney);
});
