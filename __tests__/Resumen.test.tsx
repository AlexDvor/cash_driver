import React from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../src/app/AppNavigator';
import { RootStackParamList } from '../src/app/navigationTypes';
import {
  PersistenceProvider,
  usePersistence,
} from '../src/app/PersistenceProvider';
import { Persistence } from '../src/app/persistence';
import { LanguageProvider } from '../src/i18n/LanguageProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { SqlConnection } from '../src/database/sqlite';
import { CashTransaction } from '../src/features/transactions/types';
import { createTransactionRepository } from '../src/features/transactions/transactionRepository';
import { DELETION_UNDO_SECONDS } from '../src/features/transactions/deletionConstants';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';

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
      changeAsTip: platform === 'cabify',
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
  for (const language of ['en', 'uk', 'es'] as const) {
    await act(async () => {
      await preferences.updatePreferences({
        language,
        themeMode: language === 'uk' ? 'dark' : 'light',
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
    });
    await seed(new Date(new Date(end).getTime() - 1).toISOString(), {
      ...validInput,
      platform: 'cabify',
      fareAmountCents: 101,
      cashReceivedCents: 200,
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
        { ...validInput, platform: 'bolt', changeAsTip: false },
      )
    ).id;
  });
  expectCount(2);
  await act(async () => {
    await services.transactions.edit(original.id, {
      ...validInput,
      platform: 'cabify',
      fareAmountCents: 1900,
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
    let resolve: (rows: CashTransaction[]) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const old = new Promise<CashTransaction[]>((ok, fail) => {
      resolve = ok;
      reject = fail;
    });
    const list = jest
      .spyOn(services.transactions, 'list')
      .mockImplementationOnce(() => old);
    await press('Semana');
    expect(content()).toContain('Cargando resumen');
    expect(text('summary-fareTotal')).toBe('undefined');
    await press('Mes');
    expectCount(1);
    await act(async () => {
      if (outcome === 'success') {
        resolve([]);
      } else {
        reject(Error('stale'));
      }
    });
    expectCount(1);
    list.mockRejectedValueOnce(Error('read failure'));
    await press('Hoy');
    expect(content()).toContain('No se pudo cargar el resumen');
    expect(text('summary-fareTotal')).toBe('undefined');
    expect(text('summary-count')).toBe('undefined');
    await press('Reintentar');
    expectCount(0);
  },
);

test('pending deletion and undo keep saved totals; failed delete keeps totals, retry commit refreshes', async () => {
  const row = await seed('2026-10-08T08:00:00Z');
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
  expect(text('summary-retained')).toMatch(/20,00/);
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
  await db.execute('DROP TRIGGER reject_delete');
  await press('Reintentar');
  expectCount(0);
  expect(text('summary-retained')).toMatch(/0,00/);
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
