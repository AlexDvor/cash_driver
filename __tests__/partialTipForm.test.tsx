import React from 'react';
import { AppState, Keyboard, TextInput } from 'react-native';
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
  expect(field(label).props.editable).not.toBe(false);
  await act(async () => {
    field(label).props.onFocus();
    field(label).props.onChangeText(raw);
  });
}
function tipSection() {
  const nodes = app.root.findAll(
    node =>
      node.props.testID === 'tip-section-toggle' &&
      typeof node.props.onPress === 'function',
  );
  const section = nodes[nodes.length - 1];
  if (!section) {
    throw Error('Missing tip section');
  }
  return section;
}
async function expandTip() {
  if (!tipSection().props.accessibilityState.expanded) {
    await act(async () => tipSection().props.onPress());
  }
  expect(tipSection().props.accessibilityState.expanded).toBe(true);
}
async function toggleTip() {
  await act(async () => tipSection().props.onPress());
}
function changeResult() {
  return displayedText('change-result');
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

test('new form keeps tip controls hidden and disabled until explicit expansion, without focusing the input', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  await mount();
  const contentNodes = app.root.findAllByProps({
    testID: 'tip-section-content',
  });
  const content = contentNodes[contentNodes.length - 1];
  expect(tipSection().props.accessibilityRole).toBe('button');
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toBe('+ Añadir propina');
  expect(content.props.pointerEvents).toBe('none');
  expect(content.props.accessibilityElementsHidden).toBe(true);
  expect(content.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(field('Propina').props.editable).toBe(false);
  expect(field('Propina').props.autoFocus).not.toBe(true);
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await expandTip();
  expect(dismiss).not.toHaveBeenCalled();
  expect(field('Propina').props.editable).toBe(true);
  expect(field('Propina').props.autoFocus).not.toBe(true);
  expect(field('Propina').props.value).toBe('');
  expect(changeResult()).toMatch(/30,00/);
  await toggleTip();
  await press('Confirmar cobro');
  expect((await services.transactions.list())[0]).toMatchObject({
    tipCents: 0,
    changeGivenCents: 3000,
  });
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
});

test.each(['empty', 'zero', 'removed'])(
  'collapsed %s tip creates one SQLite operation without tips',
  async draft => {
    await mount();
    await input('Importe a cobrar', '20');
    await input('El cliente entrega', '50');
    if (draft !== 'empty') {
      await expandTip();
      await input('Propina', draft === 'zero' ? '0' : '5');
      if (draft === 'removed') {
        await press('Quitar propina');
      } else {
        await toggleTip();
      }
    }
    expect(tipSection().props.accessibilityState.expanded).toBe(false);
    expect(tipSection().props.accessibilityLabel).toBe('+ Añadir propina');
    expect(field('Propina').props.editable).toBe(false);
    expect(changeResult()).toMatch(/30,00/);
    await press('Confirmar cobro');
    expect(await services.transactions.list()).toEqual([
      expect.objectContaining({
        fareAmountCents: 2000,
        cashReceivedCents: 5000,
        tipCents: 0,
        changeGivenCents: 3000,
        netCashCents: 2000,
      }),
    ]);
    expect(tipSection().props.accessibilityState.expanded).toBe(false);
    expect(field('Propina').props.value).toBe('');
  },
);

test('collapsed partial tip retains exact change and a localized visible amount; remove restores all change', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await expandTip();
  await input('Propina', '5,');
  await toggleTip();
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toMatch(/Propina:.*5,00/);
  expect(field('Propina').props.value).toBe('5,00');
  expect(changeResult()).toMatch(/25,00/);
  await act(async () => {
    await preferences.updatePreferences({ language: 'en', themeMode: 'dark' });
  });
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toMatch(/Tip:.*5\.00/);
  expect(field('Tip').props.value).toBe('5,00');
  await act(async () => {
    await preferences.updatePreferences({ language: 'uk', themeMode: 'light' });
  });
  expect(tipSection().props.accessibilityLabel).toMatch(/Чайові:.*5,00/);
  await expandTip();
  await press('Прибрати чайові');
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toBe('+ Додати чайові');
  expect(field('Чайові').props.value).toBe('');
  expect(changeResult()).toMatch(/30,00/);
});

test('invalid or excessive tip cannot collapse and focused trailing separator normalizes without hiding an error', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await expandTip();
  for (const raw of ['31', '31,', '-1', 'malformed']) {
    await input('Propina', raw);
    await toggleTip();
    expect(tipSection().props.accessibilityState.expanded).toBe(true);
    expect(field('Propina').props.value).toBe(raw);
    expect(button('Confirmar cobro').props.disabled).toBe(true);
    expect(
      app.root.findAll(node => node.props.accessibilityRole === 'alert').length,
    ).toBeGreaterThan(0);
  }
  await input('Propina', '5,');
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(field('Propina').props.value).toBe('5,00');
  expect(changeResult()).toMatch(/25,00/);
  await press('Confirmar cobro');
  expect((await services.transactions.list())[0]).toMatchObject({
    tipCents: 500,
    changeGivenCents: 2500,
  });
});

test('full change remains a tip while collapsed and success resets the section', async () => {
  await mount();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await expandTip();
  await press('Todo el cambio como propina');
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toMatch(/Propina:.*30,00/);
  expect(changeResult()).toMatch(/0,00/);
  await press('Confirmar cobro');
  expect((await services.transactions.list())[0]).toMatchObject({
    tipCents: 3000,
    changeGivenCents: 0,
  });
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toBe('+ Añadir propina');
});

test('persisted partial tip displays independently and edit refreshes history, daily and every period without duplication', async () => {
  await mount();
  await expandTip();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await input('Propina', '5');
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toMatch(/Propina:.*5,00/);
  expect(field('Propina').props.editable).toBe(false);
  expect(changeResult()).toMatch(/25,00/);
  await press('Confirmar cobro');
  const [original] = await services.transactions.list();
  expect(original).toMatchObject({
    fareAmountCents: 2000,
    cashReceivedCents: 5000,
    tipCents: 500,
    changeGivenCents: 2500,
    netCashCents: 2500,
  });
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
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toMatch(/Propina:.*7,00/);
  expect(field('Propina').props.editable).toBe(false);
  expect(changeResult()).toMatch(/23,00/);
  await press('Guardar cambios');
  expect(detailAmount('Propinas')).toContain('7,00');
  expect(detailAmount('Cambio entregado')).toContain('23,00');
  expect(detailAmount('Efectivo retenido')).toContain('27,00');
  expect(await services.transactions.list()).toEqual([
    expect.objectContaining({
      id: original.id,
      createdAt: original.createdAt,
      updatedAt: '2026-10-09T10:00:00.000Z',
      fareAmountCents: 2000,
      cashReceivedCents: 5000,
      tipCents: 700,
      changeGivenCents: 2300,
      netCashCents: 2700,
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
  await expandTip();
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
  await expandTip();
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
  await press('Quitar propina');
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  await expandTip();
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
  await expandTip();
  expect(button('Todo el cambio como propina').props.disabled).toBe(true);
  expect(button('Quitar propina').props.disabled).toBe(false);
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '19');
  await input('Propina', 'malformed');
  expect(changeResult()).toMatch(/Faltan.*1,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(true);
  expect(button('Todo el cambio como propina').props.disabled).toBe(true);
  await press('Quitar propina');
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  await expandTip();
  expect(changeResult()).toMatch(/Faltan.*1,00/);
  await input('El cliente entrega', '20');
  expect(button('Todo el cambio como propina').props.disabled).toBe(true);
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  await input('Propina', '1');
  expect(changeResult()).toBe('—');
  expect(button('Confirmar cobro').props.disabled).toBe(true);
  await press('Quitar propina');
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  await expandTip();
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  await input('El cliente entrega', '50');
  expect(button('Todo el cambio como propina').props.disabled).toBe(false);
});

test('tip draft formats only on blur and money edits/quick amounts reset it', async () => {
  await mount();
  await expandTip();
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
  await press('Quitar propina');
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  await expandTip();
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
  await expandTip();
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
  const save = jest.spyOn(services.transactions, 'save');
  await expandTip();
  await input('Importe a cobrar', '20');
  await input('El cliente entrega', '50');
  await input('Propina', '5,25');
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toMatch(/Propina:.*5,25/);
  expect(changeResult()).toMatch(/24,75/);
  await db.execute(
    "CREATE TRIGGER reject_partial_insert BEFORE INSERT ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  await press('Confirmar cobro');
  expect(save).toHaveBeenCalledTimes(1);
  const [pending, attemptedInput] = save.mock.calls[0];
  expect(attemptedInput).toMatchObject({
    fareAmountCents: 2000,
    cashReceivedCents: 5000,
    tipCents: 525,
  });
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(field('Propina').props.value).toBe('5,25');
  expect(field('Importe a cobrar').props.value).toBe('20');
  expect(field('El cliente entrega').props.value).toBe('50');
  expect(await services.transactions.list()).toHaveLength(0);
  await expandTip();
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(field('Propina').props.value).toBe('5,25');
  expect(changeResult()).toMatch(/24,75/);
  expect(button('Reintentar cobro').props.disabled).toBe(false);
  expect(save).toHaveBeenCalledTimes(1);
  jest.setSystemTime(new Date('2026-10-09T11:00:00Z'));
  await db.execute('DROP TRIGGER reject_partial_insert');
  await act(async () => {
    const retry = button('Reintentar cobro').props.onPress;
    await Promise.all([retry(), retry()]);
  });
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1]).toEqual([pending, attemptedInput]);
  expect(await services.transactions.list()).toEqual([
    expect.objectContaining({
      id: pending.id,
      createdAt: '2026-10-09T11:00:00.000Z',
      fareAmountCents: 2000,
      cashReceivedCents: 5000,
      tipCents: 525,
      changeGivenCents: 2475,
      netCashCents: 2525,
    }),
  ]);
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(field('Propina').props.value).toBe('');
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
  expect(tipSection().props.accessibilityState.expanded).toBe(true);
  expect(field('Propina').props.value).toBe('5,00');
  await input('Propina', '7,25');
  await press('Cancelar');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await press('Editar');
  await input('Propina', '7,25');
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toMatch(/Propina:.*7,25/);
  expect(changeResult()).toMatch(/22,75/);
  const update = jest.spyOn(services.transactions, 'edit');
  jest.setSystemTime(new Date('2026-10-09T10:00:00Z'));
  await db.execute(
    "CREATE TRIGGER reject_partial_edit BEFORE UPDATE ON transactions BEGIN SELECT RAISE(ABORT, 'test failure'); END",
  );
  await press('Guardar cambios');
  expect(update).toHaveBeenCalledTimes(1);
  const attemptedUpdate = update.mock.calls[0];
  expect(attemptedUpdate).toEqual([
    original.id,
    {
      platform: original.platform,
      fareAmountCents: 2000,
      cashReceivedCents: 5000,
      tipCents: 725,
    },
  ]);
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(field('Propina').props.value).toBe('7,25');
  expect(await services.transactions.get(original.id)).toEqual(original);
  await expandTip();
  await toggleTip();
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(field('Propina').props.value).toBe('7,25');
  expect(changeResult()).toMatch(/22,75/);
  expect(button('Reintentar cambios').props.disabled).toBe(false);
  expect(update).toHaveBeenCalledTimes(1);
  jest.setSystemTime(new Date('2026-10-10T11:00:00Z'));
  await db.execute('DROP TRIGGER reject_partial_edit');
  const retry = button('Reintentar cambios').props.onPress;
  await act(async () => {
    await Promise.all([retry(), retry()]);
  });
  expect(update).toHaveBeenCalledTimes(2);
  expect(update.mock.calls[1]).toEqual(attemptedUpdate);
  expect(await services.transactions.get(original.id)).toMatchObject({
    id: original.id,
    createdAt: original.createdAt,
    updatedAt: '2026-10-10T11:00:00.000Z',
    fareAmountCents: 2000,
    cashReceivedCents: 5000,
    tipCents: 725,
    changeGivenCents: 2275,
    netCashCents: 2725,
  });
  expect(await services.transactions.list()).toHaveLength(1);
  await expandTip();
  await toggleTip();
  expect(button('Guardar cambios').props.disabled).toBe(true);
  await act(async () => {
    await button('Guardar cambios').props.onPress();
    await retry();
  });
  expect(update).toHaveBeenCalledTimes(2);
});

test('editing a saved operation without tips starts collapsed and cancellation leaves it unchanged', async () => {
  const original = await services.transactions.save(
    services.transactions.newPendingOperation(),
    {
      platform: 'uber',
      fareAmountCents: 2000,
      cashReceivedCents: 5000,
      tipCents: 0,
    },
  );
  await mount();
  await edit(original.id);
  expect(tipSection().props.accessibilityState.expanded).toBe(false);
  expect(tipSection().props.accessibilityLabel).toBe('+ Añadir propina');
  expect(field('Propina').props.editable).toBe(false);
  await expandTip();
  await input('Propina', '5');
  await toggleTip();
  expect(tipSection().props.accessibilityLabel).toMatch(/Propina:.*5,00/);
  await press('Cancelar');
  expect(await services.transactions.get(original.id)).toEqual(original);
});
