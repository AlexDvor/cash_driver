import React from 'react';
import { Alert, AppState, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../src/navigation/AppNavigator';
import { RootStackParamList } from '../src/navigation/navigationTypes';
import {
  PersistenceProvider,
  usePersistence,
} from '../src/providers/PersistenceProvider/PersistenceProvider';
import { Persistence } from '../src/app/persistence';
import { LanguageProvider } from '../src/providers/LanguageProvider/LanguageProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider/ThemeProvider';
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
let preferences: ReturnType<typeof usePersistence>;
let ref = createNavigationContainerRef<RootStackParamList>();
const originalState = AppState.currentState;
function Probe() {
  preferences = usePersistence();
  return null;
}
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
  const matches = app.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel === label,
  );
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
  await press('Editar');
}

test('real history combines period/platform filters, shows groups and preserved filters across languages/themes', async () => {
  const today = await seed();
  const old = await seed('bolt', '2026-09-30T08:00:00Z');
  await mount();
  await press('Historial');
  expect(rowIds()).toEqual([`history-${today.id}`]);
  await press('Todo');
  expect(rowIds()).toHaveLength(2);
  await press('Bolt');
  expect(rowIds()).toEqual([`history-${old.id}`]);
  await act(async () => {
    await preferences.updatePreferences({ language: 'en', themeMode: 'dark' });
  });
  expect(rowIds()).toEqual([`history-${old.id}`]);
  expect(content()).toContain('Your cash payments');
  await press('Today');
  expect(content()).toContain('No operations match these filters');
});
test('genuine empty state navigates Home; load error shows retry without fabricated rows', async () => {
  await mount();
  await press('Historial');
  expect(content()).toContain('Todavía no hay operaciones');
  await press('Registrar cobro');
  expect(ref.getCurrentRoute()?.name).toBe('Home');
  jest
    .spyOn(services.transactions, 'list')
    .mockRejectedValueOnce(Error('read failed'));
  await press('Historial');
  expect(content()).toContain('No se pudieron cargar las operaciones');
  expect(rowIds()).toEqual([]);
  await press('Reintentar');
  expect(content()).toContain('Todavía no hay operaciones');
});

test('loading has no fabricated rows and a stale pre-edit response cannot overwrite refreshed history', async () => {
  const original = await seed();
  await mount();
  let release: (rows: CashTransaction[]) => void = () => {};
  const oldRead = new Promise<CashTransaction[]>(resolve => {
    release = resolve;
  });
  jest
    .spyOn(services.transactions, 'list')
    .mockImplementationOnce(() => oldRead);
  await press('Historial');
  expect(content()).toContain('Cargando operaciones');
  expect(rowIds()).toEqual([]);
  await act(async () => {
    await services.transactions.edit(original.id, {
      ...validInput,
      fareAmountCents: 1900,
      tipCents: 0,
    });
  });
  expect(rowIds()).toEqual([`history-${original.id}`]);
  await act(async () => {
    release([original]);
    await oldRead;
  });
  const row = app.root.findAll(
    node =>
      node.props.testID === `history-${original.id}` &&
      typeof node.props.onPress === 'function',
  )[0];
  expect(row.props.accessibilityLabel).toContain('19,00');
});

test('failed native-shaped delete keeps row and exposes global retry after switching tabs', async () => {
  const original = await seed();
  await mount();
  await details(original.id);
  await db.execute(
    "CREATE TRIGGER reject_delete BEFORE DELETE ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  const alert = jest.spyOn(Alert, 'alert');
  await press('Eliminar');
  await act(async () =>
    alert.mock.calls[0][2]
      ?.find(action => action.style === 'destructive')
      ?.onPress?.(),
  );
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  expect(content()).toContain('No se pudo eliminar la operación');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await act(async () => ref.navigate('Tabs', { screen: 'Settings' }));
  expect(button('Reintentar').props.disabled).toBe(false);
  await db.execute('DROP TRIGGER reject_delete');
  await press('Reintentar');
  expect(await services.transactions.get(original.id)).toBeNull();
});
test('details and edit prefill tip, cancel/back do not write; edit preserves ID/date/default and refreshes consumers after commit', async () => {
  const original = await seed('cabify');
  await mount();
  await press('Historial');
  await edit(original.id);
  expect(field('Importe a cobrar').props.value).toBe('18,00');
  expect(field('Propina').props.value).toBe('2,00');
  await input('Importe a cobrar', '19');
  expect(field('Propina').props.value).toBe('');
  await press('Cancelar');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await press('Editar');
  await input('Importe a cobrar', '17');
  await act(async () => ref.goBack());
  expect(await services.transactions.get(original.id)).toEqual(original);
  await press('Editar');
  await input('Importe a cobrar', '19');
  await press('Bolt');
  jest.setSystemTime(new Date('2026-10-08T11:00:00Z'));
  const editWrite = jest.spyOn(services.transactions, 'edit');
  await act(async () => {
    const save = button('Guardar cambios').props.onPress;
    await Promise.all([save(), save()]);
  });
  expect(editWrite).toHaveBeenCalledTimes(1);
  expect(button('Guardar cambios').props.disabled).toBe(true);
  await act(async () => {
    await button('Guardar cambios').props.onPress();
  });
  expect(editWrite).toHaveBeenCalledTimes(1);
  const stored = await services.transactions.get(original.id);
  expect(stored).toMatchObject({
    id: original.id,
    createdAt: original.createdAt,
    updatedAt: '2026-10-08T11:00:00.000Z',
    platform: 'bolt',
    fareAmountCents: 1900,
    tipCents: 0,
    changeGivenCents: 100,
    netCashCents: 1900,
  });
  expect(await services.transactions.list()).toHaveLength(1);
  expect((await services.preferences.read()).defaultPlatform).toBe('uber');
  expect(content()).toContain('Operación actualizada');
  await press('Cancelar');
  await act(async () => ref.goBack());
  expect(rowIds()).toEqual([`history-${original.id}`]);
  await press('Inicio');
  expect(content()).toContain('19,00');
});
test('actual edit failure preserves draft/platform/tip and retry commits derived values with committed success amounts', async () => {
  const original = await seed();
  await mount();
  await edit(original.id);
  await input('Importe a cobrar', '17');
  await press('Todo el cambio como propina');
  await press('Cabify');
  await db.execute(
    "CREATE TRIGGER reject_edit BEFORE UPDATE ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  await press('Guardar cambios');
  expect(field('Importe a cobrar').props.value).toBe('17');
  expect(field('Propina').props.value).toBe('3,00');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await act(async () => {
    await preferences.updatePreferences({ language: 'uk', themeMode: 'dark' });
  });
  expect(field('Вартість поїздки').props.value).toBe('17');
  await db.execute('DROP TRIGGER reject_edit');
  await press('Повторити збереження змін');
  expect(await services.transactions.get(original.id)).toMatchObject({
    fareAmountCents: 1700,
    tipCents: 300,
    netCashCents: 2000,
    changeGivenCents: 0,
  });
  expect(content()).toContain('Операцію оновлено');
  expect(content()).toContain('17,00');
  expect(content()).toContain('3,00');
});
test('confirmation cancel leaves data, pending row remains in history/totals and disallows edit, undo and expiry refresh consumers', async () => {
  const original = await seed();
  await mount();
  await press('Historial');
  await details(original.id);
  const alert = jest.spyOn(Alert, 'alert');
  await press('Eliminar');
  expect(alert).toHaveBeenCalledWith(
    '¿Eliminar esta operación?',
    undefined,
    expect.any(Array),
  );
  expect(await services.transactions.get(original.id)).toEqual(original);
  await press('Eliminar');
  const actions = alert.mock.calls[1][2];
  await act(async () =>
    actions?.find(action => action.style === 'destructive')?.onPress?.(),
  );
  expect(button('Editar').props.disabled).toBe(true);
  expect(button('Eliminar').props.disabled).toBe(true);
  await act(async () => ref.goBack());
  expect(rowIds()).toEqual([`history-${original.id}`]);
  expect(content()).toContain('Eliminación pendiente');
  await press('Resumen');
  expect(button('Deshacer').props.disabled).toBe(false);
  await press('Ajustes');
  expect(button('Deshacer').props.disabled).toBe(false);
  await press('Deshacer');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await details(original.id);
  await press('Eliminar');
  await act(async () =>
    alert.mock.calls[2][2]
      ?.find(action => action.style === 'destructive')
      ?.onPress?.(),
  );
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  expect(await services.transactions.get(original.id)).toBeNull();
  await act(async () => ref.goBack());
  expect(rowIds()).toEqual([]);
  await press('Inicio');
  expect(content()).toContain('0,00');
});
