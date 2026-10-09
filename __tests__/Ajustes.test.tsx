import React from 'react';
import {
  Alert,
  AppState,
  TextInput,
  Switch,
  NativeModules,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../src/app/AppNavigator';
import { RootStackParamList } from '../src/app/navigationTypes';
import { PersistenceProvider } from '../src/app/PersistenceProvider';
import { Persistence } from '../src/app/persistence';
import { LanguageProvider } from '../src/i18n/LanguageProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { SqlConnection } from '../src/database/sqlite';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';
import { CashTransaction } from '../src/features/transactions/types';

let db: SqlConnection;
let services: Persistence;
let app: ReactTestRenderer.ReactTestRenderer;
let ref = createNavigationContainerRef<RootStackParamList>();
const originalState = AppState.currentState;
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-08T10:00:00Z'));
  AppState.currentState = 'active';
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
          <LanguageProvider>
            <ThemeProvider>
              <AppNavigator navigationRef={ref} />
            </ThemeProvider>
          </LanguageProvider>
        </PersistenceProvider>
      </SafeAreaProvider>,
    );
  });
}
async function seed(
  platform: CashTransaction['platform'] = 'uber',
  date = '2026-10-08T08:00:00Z',
) {
  jest.setSystemTime(new Date(date));
  const record = await services.transactions.save(
    services.transactions.newPendingOperation(),
    { ...validInput, platform },
  );
  jest.setSystemTime(new Date('2026-10-08T10:00:00Z'));
  return record;
}
function button(label: string) {
  const screenName = `${ref.getCurrentRoute()?.name}Screen`;
  const screen = app.root.findAll(
    node => typeof node.type === 'function' && node.type.name === screenName,
  )[0];
  const scope = screen ?? app.root;
  let matches = scope.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel === label,
  );
  if (matches.length === 0 && screen) {
    matches = app.root.findAll(
      node =>
        typeof node.props.onPress === 'function' &&
        node.props.accessibilityLabel === label,
    );
  }
  const found = matches[matches.length - 1];
  if (!found) {
    throw Error(`Missing ${label}`);
  }
  return found;
}
async function press(label: string) {
  await act(async () => {
    await button(label).props.onPress();
  });
}
function field(label: string) {
  const matches = app.root
    .findAllByType(TextInput)
    .filter(node => node.props.accessibilityLabel === label);
  const found = matches[matches.length - 1];
  if (!found) {
    throw Error(`Missing field ${label}`);
  }
  return found;
}
async function input(label: string, raw: string) {
  await act(async () => {
    field(label).props.onFocus();
    field(label).props.onChangeText(raw);
  });
}
function rowIds() {
  return app.root
    .findAll(
      node =>
        typeof node.props.onPress === 'function' &&
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('history-'),
    )
    .map(node => node.props.testID);
}
function content() {
  return JSON.stringify(app.toJSON());
}
async function details(id: string) {
  await act(async () => ref.navigate('Details', { id }));
}
async function edit(id: string) {
  await details(id);
  await press('Edit');
}

jest.mock('react-native-haptic-feedback', () => ({
  isSupported: jest.fn(() => true),
  trigger: jest.fn(),
}));
const feedback = jest.requireMock('react-native-haptic-feedback') as {
  isSupported: jest.Mock;
  trigger: jest.Mock;
};
function switchValue() {
  return app.root
    .findAllByType(Switch)
    .find(node => node.props.testID === 'settings-haptics-switch')?.props.value;
}
async function toggle(enabled: boolean) {
  if (switchValue() !== enabled) {
    await press('Confirmación háptica');
  }
}
async function confirmAll() {
  const actions = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
  await act(async () => {
    await actions?.find(action => action.style === 'destructive')?.onPress?.();
  });
}

test('initial EUR/Spanish/system/Uber/disabled haptics and installed metadata; all choices restore on remount', async () => {
  NativeModules.CashDriverAppVersion = { version: '1.0', build: '1' };
  await mount();
  await press('Ajustes');
  expect(content()).toContain('EUR (€)');
  expect(content()).toContain('0.0.1');
  expect(switchValue()).toBe(false);
  await press('Cabify');
  await toggle(true);
  await press('English');
  await press('Dark');
  const saved = await services.preferences.read();
  expect(saved).toEqual({
    language: 'en',
    themeMode: 'dark',
    defaultPlatform: 'cabify',
    hapticsEnabled: true,
  });
  await act(async () => app.unmount());
  await mount();
  await press('Settings');
  expect(content()).toContain('Data stays only on this device');
  expect(button('Dark').props.accessibilityState.selected).toBe(true);
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
  expect(await services.preferences.read()).toEqual(saved);
});

test('latest explicit Home/Settings platform wins without replacing draft; edit leaves default unchanged', async () => {
  const row = await seed();
  await mount();
  await press('Cabify');
  await input('Importe a cobrar', '18.5');
  await input('El cliente entrega', '20');
  await press('El cambio es propina');
  await press('Ajustes');
  await press('Bolt');
  await press('English');
  await press('Dark');
  await press('Home');
  expect(field('Trip fare').props.value).toBe('18.5');
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
  expect(
    button('Keep all change as a tip').props.accessibilityState.checked,
  ).toBe(true);
  await press('Otro');
  expect((await services.preferences.read()).defaultPlatform).toBe('other');
  await edit(row.id);
  await input('Trip fare', '19');
  await press('Save changes');
  expect((await services.preferences.read()).defaultPlatform).toBe('other');
  await press('Cancel');
  await act(async () => ref.goBack());
  await press('Settings');
  expect(button('Otro').props.accessibilityState.selected).toBe(true);
});

test.each(['language', 'theme', 'platform', 'haptics'])(
  'failed %s preference keeps committed value and retries original patch',
  async kind => {
    await mount();
    await press('Ajustes');
    const original = await services.preferences.read();
    await db.execute(
      "CREATE TRIGGER reject_preferences BEFORE UPDATE ON preferences BEGIN SELECT RAISE(ABORT, 'test failure'); END",
    );
    if (kind === 'language') {
      await press('English');
    }
    if (kind === 'theme') {
      await press('Oscuro');
    }
    if (kind === 'platform') {
      await press('Bolt');
    }
    if (kind === 'haptics') {
      await toggle(true);
    }
    expect(await services.preferences.read()).toEqual(original);
    expect(content()).toContain('No se pudo guardar');
    expect(switchValue()).toBe(false);
    await db.execute('DROP TRIGGER reject_preferences');
    await press('Reintentar preferencia');
    const changes = {
      language: { language: 'en' },
      theme: { themeMode: 'dark' },
      platform: { defaultPlatform: 'bolt' },
      haptics: { hapticsEnabled: true },
    };
    expect(await services.preferences.read()).toMatchObject(
      changes[kind as keyof typeof changes],
    );
  },
);

test('saving preference disables controls and retains committed state until write finishes', async () => {
  await mount();
  await press('Ajustes');
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const update = services.preferences.update;
  jest.spyOn(services.preferences, 'update').mockImplementation(async patch => {
    await gate;
    return update(patch);
  });
  await act(async () => {
    button('English').props.onPress();
  });
  expect(button('English').props.disabled).toBe(true);
  expect(content()).toContain('Guardando preferencia');
  expect(await services.preferences.read()).toMatchObject({ language: 'es' });
  await act(async () => {
    release();
    await gate;
  });
  expect(content()).toContain('Currency');
});

test('feedback occurs once after successful payment, disabled/failure does not alter committed save', async () => {
  feedback.trigger.mockClear();
  feedback.isSupported.mockReturnValue(true);
  await mount();
  await press('Ajustes');
  await toggle(true);
  await press('Inicio');
  await input('Importe a cobrar', '18');
  await input('El cliente entrega', '20');
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const save = services.transactions.save;
  jest
    .spyOn(services.transactions, 'save')
    .mockImplementation(async (...args) => {
      await gate;
      return save(...args);
    });
  let writing: Promise<boolean> | undefined;
  await act(async () => {
    writing = button('Confirmar cobro').props.onPress();
    button('Confirmar cobro').props.onPress();
  });
  expect(feedback.trigger).not.toHaveBeenCalled();
  feedback.trigger.mockImplementation(() => {
    throw Error('native failure');
  });
  await act(async () => {
    release();
    await writing;
  });
  expect(feedback.trigger).toHaveBeenCalledTimes(1);
  expect(await services.transactions.list()).toHaveLength(1);
  expect(field('Importe a cobrar').props.value).toBe('');
  expect(content()).toContain('Cobro registrado');
  await press('Ajustes');
  await toggle(false);
  await press('Inicio');
  await input('Importe a cobrar', '10');
  await input('El cliente entrega', '10');
  await press('Confirmar cobro');
  expect(feedback.trigger).toHaveBeenCalledTimes(1);
});

test('a rejected payment never triggers enabled feedback and keeps its draft', async () => {
  feedback.trigger.mockClear();
  await mount();
  await press('Ajustes');
  await toggle(true);
  await press('Inicio');
  await input('Importe a cobrar', '18');
  await input('El cliente entrega', '20');
  await db.execute(
    "CREATE TRIGGER reject_payment BEFORE INSERT ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  await press('Confirmar cobro');
  expect(feedback.trigger).not.toHaveBeenCalled();
  expect(await services.transactions.list()).toEqual([]);
  expect(field('Importe a cobrar').props.value).toBe('18');
});

test('delete-all Cancel writes nothing; confirmation atomically clears rows, preserves preferences and refreshes all tabs', async () => {
  await seed();
  await seed('cabify');
  await mount();
  await press('Historial');
  expect(rowIds()).toHaveLength(2);
  await press('Resumen');
  await press('Ajustes');
  await press('Bolt');
  await toggle(true);
  const saved = await services.preferences.read();
  const alert = jest.spyOn(Alert, 'alert');
  await press('Eliminar todas las operaciones');
  expect(alert.mock.calls[0][1]).toContain('no se puede deshacer');
  await act(async () =>
    alert.mock.calls[0][2]
      ?.find(action => action.style === 'cancel')
      ?.onPress?.(),
  );
  expect(await services.transactions.list()).toHaveLength(2);
  await press('Eliminar todas las operaciones');
  await confirmAll();
  expect(await services.transactions.list()).toEqual([]);
  expect(await services.preferences.read()).toEqual(saved);
  expect(content()).toContain('Se eliminaron todas las operaciones');
  await press('Historial');
  expect(rowIds()).toEqual([]);
  await press('Resumen');
  expect(content()).toContain('No hay operaciones en este período');
  await press('Inicio');
  expect(content()).toContain('Operaciones');
  expect(content()).toContain('0,00');
});

test('delete-all failure rolls back every deletion and only a confirmed retry reports success', async () => {
  await seed();
  await seed('cabify');
  await mount();
  await press('Ajustes');
  const original = await services.transactions.list();
  await db.execute(
    "CREATE TRIGGER reject_second BEFORE DELETE ON transactions WHEN old.platform='cabify' BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  jest.spyOn(Alert, 'alert');
  await press('Eliminar todas las operaciones');
  await confirmAll();
  expect(await services.transactions.list()).toEqual(original);
  expect(content()).toContain('No se pudieron eliminar');
  expect(content()).not.toContain('Se eliminaron todas');
  await db.execute('DROP TRIGGER reject_second');
  await press('Reintentar eliminar todo');
  await confirmAll();
  expect(await services.transactions.list()).toEqual([]);
});

test('pending single deletion blocks clear-all, including a dialog opened before it began', async () => {
  const row = await seed();
  await mount();
  await press('Ajustes');
  const alert = jest.spyOn(Alert, 'alert');
  await press('Eliminar todas las operaciones');
  const oldConfirmation = alert.mock.calls[0][2]?.find(
    action => action.style === 'destructive',
  )?.onPress;
  await details(row.id);
  await press('Eliminar');
  await confirmAll();
  await act(async () => ref.goBack());
  expect(button('Eliminar todas las operaciones').props.disabled).toBe(true);
  await act(async () => {
    oldConfirmation?.();
  });
  expect(await services.transactions.get(row.id)).toEqual(row);
  await press('Deshacer');
  expect(button('Eliminar todas las operaciones').props.disabled).toBe(false);
});

test('shared write lock prevents duplicate clear-all and blocks single destructive actions on another route', async () => {
  const row = await seed();
  await mount();
  await press('Ajustes');
  jest.spyOn(Alert, 'alert');
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const removeAll = services.transactions.removeAll;
  const spy = jest
    .spyOn(services.transactions, 'removeAll')
    .mockImplementation(async () => {
      await gate;
      await removeAll();
    });
  await press('Eliminar todas las operaciones');
  const confirm = jest
    .mocked(Alert.alert)
    .mock.calls[0][2]?.find(action => action.style === 'destructive')?.onPress;
  await act(async () => {
    confirm?.();
    confirm?.();
  });
  expect(spy).toHaveBeenCalledTimes(1);
  expect(button('Eliminando todas las operaciones…').props.disabled).toBe(true);
  await details(row.id);
  expect(button('Eliminar').props.disabled).toBe(true);
  await act(async () => {
    release();
    await gate;
  });
  expect(await services.transactions.list()).toEqual([]);
});

test('missing installed metadata is retryable and never substitutes package version', async () => {
  delete NativeModules.CashDriverAppVersion;
  await mount();
  await press('Ajustes');
  expect(content()).toContain('No se pudo leer la versión');
  expect(app.root.findAllByProps({ testID: 'app-version' })).toHaveLength(0);
  NativeModules.CashDriverAppVersion = { version: '2.1', build: '19' };
  await press('Reintentar versión');
  expect(content()).toContain('2.1');
});
