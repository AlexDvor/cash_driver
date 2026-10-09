import React from 'react';
import { AppState, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../src/navigation/AppNavigator';
import { RootStackParamList } from '../src/navigation/navigationTypes';
import { AppText } from '../src/ui/AppText/AppText';
import {
  PersistenceProvider,
  usePersistence,
} from '../src/providers/PersistenceProvider/PersistenceProvider';
import { Persistence } from '../src/app/persistence';
import { LanguageProvider } from '../src/providers/LanguageProvider/LanguageProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider/ThemeProvider';
import { SqlConnection } from '../src/database/sqlite';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

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
function changeResult() {
  return String(
    app.root.findByProps({ testID: 'change-result' }).props.children,
  );
}
async function details(id: string) {
  await act(async () => ref.navigate('Details', { id }));
}
async function edit(id: string) {
  await details(id);
  await press('Editar');
}

function displayedText(id: string) {
  const nodes = app.root.findAllByProps({ testID: id });
  const children = nodes[nodes.length - 1]?.props.children;
  return Array.isArray(children) ? children.join('') : String(children);
}

function detailAmount(label: string) {
  const labels = app.root
    .findAllByType(AppText)
    .filter(node => node.props.children === label);
  const labelNode = labels[labels.length - 1];
  let row = labelNode?.parent;
  while (row) {
    const values = row.findAllByType(AppText);
    if (values.length === 2 && values[0] === labelNode) {
      return String(values[1].props.children);
    }
    row = row.parent;
  }
  throw Error(`Missing detail ${label}`);
}

test('persisted partial tip displays independently and edit refreshes history, daily and every period without duplication', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await input('Propina', '5');
  await press('Confirmar cobro');
  const [original] = await services.transactions.list();
  expect(displayedText('payment-success')).toMatch(
    /Importe de viaje:.*20,00.*Propina:.*5,00/,
  );
  expect(displayedText('fareTotal')).toMatch(/20,00/);
  expect(displayedText('tipsTotal')).toMatch(/5,00/);
  expect(displayedText('retainedCash')).toMatch(/25,00/);
  await press('Resumen');
  for (const period of ['Hoy', 'Semana', 'Mes']) {
    await press(period);
    expect(displayedText('summary-count')).toBe('Operaciones: 1');
    expect(displayedText('summary-fareTotal')).toMatch(/20,00/);
    expect(displayedText('summary-averageFare')).toMatch(/20,00/);
    expect(displayedText('summary-tipsTotal')).toMatch(/5,00/);
    expect(displayedText('summary-retained')).toMatch(/25,00/);
  }
  await press('Historial');
  const historyRow = app.root.findAllByProps({
    testID: `history-${original.id}`,
  })[0];
  const rowText = historyRow
    .findAllByType(AppText)
    .map(node => node.props.children)
    .join(' ');
  expect(rowText).toMatch(/20,00.*Propina:.*5,00/);
  await details(original.id);
  for (const [label, amount] of [
    ['Importe a cobrar', '20,00'],
    ['El cliente entrega', '50,00'],
    ['Cambio entregado', '25,00'],
    ['Propinas', '5,00'],
    ['Efectivo retenido', '25,00'],
  ]) {
    expect(detailAmount(label)).toContain(amount);
  }
  await press('Editar');
  jest.setSystemTime(new Date('2026-10-09T10:00:00Z'));
  await input('Propina', '7');
  await press('Guardar cambios');
  expect(detailAmount('Propinas')).toContain('7,00');
  expect(detailAmount('Cambio entregado')).toContain('23,00');
  expect(detailAmount('Efectivo retenido')).toContain('27,00');
  expect(await services.transactions.list()).toEqual([
    expect.objectContaining({
      id: original.id,
      createdAt: original.createdAt,
      tipCents: 700,
    }),
  ]);
  await act(async () => ref.goBack());
  await press('Todo');
  const updatedRow = app.root.findAllByProps({
    testID: `history-${original.id}`,
  })[0];
  expect(
    updatedRow
      .findAllByType(AppText)
      .map(node => node.props.children)
      .join(' '),
  ).toMatch(/20,00.*Propina:.*7,00/);
  await press('Inicio');
  await act(async () => jest.advanceTimersByTime(1000));
  expect(displayedText('daily-count')).toBe('Operaciones: 0');
  expect(displayedText('retainedCash')).toMatch(/0,00/);
  jest.setSystemTime(new Date('2026-10-08T12:00:00Z'));
  await act(async () => jest.advanceTimersByTime(1000));
  expect(displayedText('daily-count')).toBe('Operaciones: 1');
  expect(displayedText('fareTotal')).toMatch(/20,00/);
  expect(displayedText('tipsTotal')).toMatch(/7,00/);
  expect(displayedText('retainedCash')).toMatch(/27,00/);
  await press('Resumen');
  for (const period of ['Hoy', 'Semana', 'Mes']) {
    await press(period);
    expect(displayedText('summary-count')).toBe('Operaciones: 1');
    expect(displayedText('summary-fareTotal')).toMatch(/20,00/);
    expect(displayedText('summary-averageFare')).toMatch(/20,00/);
    expect(displayedText('summary-tipsTotal')).toMatch(/7,00/);
    expect(displayedText('summary-retained')).toMatch(/27,00/);
  }
});

test('partial cash tip commits exact cents once and clears the home draft', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  expect(field('Propina').props.value).toBe('');
  await input('Propina', '5');
  expect(field('Propina').props.value).toBe('5');
  expect(changeResult()).toMatch(/25,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  const save = jest.spyOn(services.transactions, 'save');
  await act(async () => {
    const confirm = button('Confirmar cobro').props.onPress;
    await Promise.all([confirm(), confirm()]);
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(await services.transactions.list()).toEqual([
    expect.objectContaining({
      fareAmountCents: 2000,
      cashReceivedCents: 5000,
      tipCents: 500,
      changeGivenCents: 2500,
      netCashCents: 2500,
    }),
  ]);
  expect(field('Propina').props.value).toBe('');
  expect(field('Importe a cobrar').props.value).toBe('');
  expect(field('El cliente entrega').props.value).toBe('');
});

test('tip validation blocks malformed and excessive drafts; actions recover either draft', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  for (const raw of ['31', '-1', '1,2.3', '1,234', '10000']) {
    await input('Propina', raw);
    expect(button('Confirmar cobro').props.disabled).toBe(true);
    expect(changeResult()).toBe('—');
    expect(
      app.root.findAll(node => node.props.accessibilityRole === 'alert').length,
    ).toBeGreaterThan(0);
  }
  await press('Todo el cambio como propina');
  expect(field('Propina').props.value).toBe('30,00');
  expect(changeResult()).toMatch(/0,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  await input('Propina', 'malformed');
  await press('Sin propina');
  expect(field('Propina').props.value).toBe('');
  expect(changeResult()).toMatch(/30,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  await press('Confirmar cobro');
  expect((await services.transactions.list())[0]).toMatchObject({
    tipCents: 0,
    changeGivenCents: 3000,
  });
});

test('full-change action requires positive available change and underpayment remains insufficient with invalid tip', async () => {
  await mount();
  expect(button('Todo el cambio como propina').props.disabled).toBe(true);
  expect(button('Sin propina').props.disabled).toBe(false);
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '19');
  await input('Propina', 'malformed');
  expect(changeResult()).toMatch(/Faltan.*1,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(true);
  expect(button('Todo el cambio como propina').props.disabled).toBe(true);
  await press('Sin propina');
  expect(changeResult()).toMatch(/Faltan.*1,00/);
  await input('El cliente entrega', '20');
  expect(button('Todo el cambio como propina').props.disabled).toBe(true);
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  await input('Propina', '1');
  expect(changeResult()).toBe('—');
  expect(button('Confirmar cobro').props.disabled).toBe(true);
  await press('Sin propina');
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  await input('El cliente entrega', '50');
  expect(button('Todo el cambio como propina').props.disabled).toBe(false);
});

test('tip draft formats only on blur and money edits/quick amounts reset it', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await input('Propina', '5,');
  expect(field('Propina').props.value).toBe('5,');
  expect(changeResult()).toBe('—');
  expect(button('Confirmar cobro').props.disabled).toBe(true);
  await act(async () => field('Propina').props.onBlur());
  expect(field('Propina').props.value).toBe('5,00');
  expect(changeResult()).toMatch(/25,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  const staleBlur = field('Propina').props.onBlur;
  await press('Todo el cambio como propina');
  await act(async () => staleBlur());
  expect(field('Propina').props.value).toBe('30,00');
  await press('Sin propina');
  await act(async () => staleBlur());
  expect(field('Propina').props.value).toBe('');
  await input('Propina', '5');
  await press('Exacto');
  expect(field('Propina').props.value).toBe('');
  expect(changeResult()).toMatch(/0,00/);
  await input('El cliente entrega', '50');
  await input('Propina', '5');
  await press('50,00 €');
  expect(field('Propina').props.value).toBe('');
  await input('Propina', '5');
  await input('Importe a cobrar', '21');
  expect(field('Propina').props.value).toBe('');
  await input('Propina', '5');
  await input('El cliente entrega', '51');
  expect(field('Propina').props.value).toBe('');
  await input('Propina', '5');
  const preCommitBlur = field('Propina').props.onBlur;
  await press('Confirmar cobro');
  await act(async () => preCommitBlur());
  expect(field('Propina').props.value).toBe('');
});

test('language and theme changes preserve the raw partial tip draft', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await input('Propina', '5,');
  await act(async () => {
    await preferences.updatePreferences({ language: 'en', themeMode: 'dark' });
  });
  expect(field('Tip').props.value).toBe('5,');
  await act(async () => {
    await preferences.updatePreferences({ language: 'uk', themeMode: 'light' });
  });
  expect(field('Чайові').props.value).toBe('5,');
  await act(async () => {
    await preferences.updatePreferences({ language: 'es', themeMode: 'dark' });
  });
  expect(field('Propina').props.value).toBe('5,');
});

test('failed home insert retains the exact raw partial tip and retry writes it once', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await input('Propina', '5,25');
  await db.execute(
    "CREATE TRIGGER reject_partial_insert BEFORE INSERT ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  await press('Confirmar cobro');
  expect(field('Propina').props.value).toBe('5,25');
  expect(field('Importe a cobrar').props.value).toBe('20');
  expect(field('El cliente entrega').props.value).toBe('50');
  expect(await services.transactions.list()).toHaveLength(0);
  await db.execute('DROP TRIGGER reject_partial_insert');
  await press('Reintentar cobro');
  expect(await services.transactions.list()).toEqual([
    expect.objectContaining({
      tipCents: 525,
      changeGivenCents: 2475,
      netCashCents: 2525,
    }),
  ]);
});

test('partial edit prefills exact tip, cancel leaves storage intact and failed SQLite write retries exact draft', async () => {
  const original = await services.transactions.save(
    services.transactions.newPendingOperation(),
    {
      platform: 'uber',
      fareAmountCents: 2000,
      cashReceivedCents: 5000,
      tipCents: 500,
    },
  );
  await mount();
  await edit(original.id);
  expect(field('Propina').props.value).toBe('5,00');
  await input('Propina', '7,25');
  await press('Cancelar');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await press('Editar');
  await input('Propina', '7,25');
  await db.execute(
    "CREATE TRIGGER reject_partial_edit BEFORE UPDATE ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  await press('Guardar cambios');
  expect(field('Propina').props.value).toBe('7,25');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await db.execute('DROP TRIGGER reject_partial_edit');
  await press('Reintentar cambios');
  expect(await services.transactions.get(original.id)).toMatchObject({
    id: original.id,
    createdAt: original.createdAt,
    fareAmountCents: 2000,
    cashReceivedCents: 5000,
    tipCents: 725,
    changeGivenCents: 2275,
    netCashCents: 2725,
  });
  expect(await services.transactions.list()).toHaveLength(1);
});
