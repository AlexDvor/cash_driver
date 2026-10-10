import React from 'react';
import { AppState, AppStateStatus, Switch, TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import { createTransactionRepository } from '../src/features/transactions/transactionRepository';
import { SqlConnection } from '../src/database/sqlite';
import { Persistence } from '../src/app/persistence';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

let db: SqlConnection;
let services: Persistence;
let app: ReactTestRenderer.ReactTestRenderer;
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-08T10:00:00Z'));
  db = openTestDatabase();
  services = await testPersistence(db, () => new Date());
});
afterEach(async () => {
  await act(async () => app?.unmount());
  db.close();
  jest.useRealTimers();
  jest.restoreAllMocks();
});
async function mount() {
  const initialize = async () => services;
  await act(async () => {
    app = ReactTestRenderer.create(<App initialize={initialize} />);
  });
}
function button(label: string) {
  const found = app.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel === label,
  )[0];
  if (!found) {
    throw new Error(`Missing button ${label}`);
  }
  return found;
}
async function press(label: string) {
  await act(async () => {
    await button(label).props.onPress();
  });
}
function field(label: string) {
  const found = app.root
    .findAllByType(TextInput)
    .find(node => node.props.accessibilityLabel === label);
  if (!found) {
    throw new Error(`Missing field ${label}`);
  }
  return found;
}
async function input(label: string, raw: string) {
  await act(async () => {
    field(label).props.onFocus();
    field(label).props.onChangeText(raw);
  });
}
async function enter(fare: string, received: string) {
  await input('Importe a cobrar', fare);
  await input('El cliente entrega', received);
}
function summaryToggle() {
  return app.root.findByProps({ testID: 'daily-summary-toggle' });
}
function summaryContent() {
  return app.root.find(
    node =>
      node.props.testID === 'daily-summary-content' &&
      node.props.pointerEvents !== undefined,
  );
}
async function toggleSummary() {
  await act(async () => summaryToggle().props.onPress());
}
async function openSummary() {
  if (!summaryToggle().props.accessibilityState.expanded) await toggleSummary();
}
function text(id: string): string {
  return String(app.root.findByProps({ testID: id }).props.children);
}
function tipValue() {
  return app.root
    .findAllByType(TextInput)
    .find(node =>
      ['Propina', 'Tip', 'Чайові'].includes(node.props.accessibilityLabel),
    )?.props.value;
}
async function tip(enabled: boolean) {
  if (
    !app.root.findByProps({ testID: 'tip-section-toggle' }).props
      .accessibilityState.expanded
  ) {
    await act(async () =>
      app.root.findByProps({ testID: 'tip-section-toggle' }).props.onPress(),
    );
  }
  await press(enabled ? 'Todo el cambio como propina' : 'Quitar propina');
}

test('ordinary change, exact and insufficient cash are immediate; malformed/zero/over-limit amounts cannot confirm', async () => {
  await mount();
  await enter('20', '50');
  expect(text('change-result')).toMatch(/30,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(false);
  await press('Exacto');
  expect(text('change-result')).toMatch(/0,00/);
  expect(app.root.findAllByType(Switch)).toHaveLength(0);
  await input('El cliente entrega', '19');
  expect(text('change-result')).toMatch(/Faltan.*1,00/);
  expect(button('Confirmar cobro').props.disabled).toBe(true);
  for (const fare of ['0', '10000', '1,2.3', '20,555', '20,']) {
    await input('Importe a cobrar', fare);
    expect(button('Confirmar cobro').props.disabled).toBe(true);
  }
  await act(async () => field('Importe a cobrar').props.onBlur());
  expect(field('Importe a cobrar').props.value).toBe('20,00');
});

test('quick values replace cash and reset tip, including same-value taps; either money edit resets it', async () => {
  await mount();
  await enter('17,40', '20');
  await tip(true);
  expect(text('change-result')).toMatch(/0,00/);
  await press('20,00 €');
  expect(tipValue()).toBe('');
  await tip(true);
  await press('50,00 €');
  expect(field('El cliente entrega').props.value).toBe('50,00');
  expect(text('change-result')).toMatch(/32,60/);
  await tip(true);
  await input('Importe a cobrar', '18');
  expect(tipValue()).toBe('');
  await tip(true);
  await input('El cliente entrega', '100');
  expect(tipValue()).toBe('');
});

test('committed tip payment clears money fields, retains platform and updates separately labeled daily totals', async () => {
  await mount();
  await press('Cabify');
  await enter('18', '20');
  await tip(true);
  await press('Confirmar cobro');
  const rows = await services.transactions.list();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    platform: 'cabify',
    fareAmountCents: 1800,
    tipCents: 200,
    netCashCents: 2000,
  });
  expect(field('Importe a cobrar').props.value).toBe('');
  expect(field('El cliente entrega').props.value).toBe('');
  expect(text('payment-success')).toMatch(
    /Importe de viaje:.*18,00.*Propina:.*2,00/,
  );
  expect(summaryToggle().props.accessibilityState.expanded).toBe(false);
  await openSummary();
  expect(text('fareTotal')).toMatch(/18,00/);
  expect(text('tipsTotal')).toMatch(/2,00/);
  expect(text('retainedCash')).toMatch(/20,00/);
  expect((await services.preferences.read()).defaultPlatform).toBe('cabify');
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
});

test('synchronous repeated taps and loading controls produce one committed operation', async () => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const save = services.transactions.save;
  const spy = jest
    .spyOn(services.transactions, 'save')
    .mockImplementation(async (...args) => {
      await gate;
      return save(...args);
    });
  await mount();
  await enter('20', '50');
  await press('+ Añadir propina');
  await input('Propina', '5');
  const tipToggle = app.root.find(
    node =>
      node.props.testID === 'tip-section-toggle' &&
      typeof node.props.onPress === 'function',
  );
  const confirm = button('Confirmar cobro');
  const queuedTipToggle = tipToggle.props.onPress;
  let first: Promise<void> | undefined;
  await act(async () => {
    first = confirm.props.onPress();
    confirm.props.onPress();
  });
  expect(spy).toHaveBeenCalledTimes(1);
  expect(button('Guardando cobro…').props.disabled).toBe(true);
  expect(field('Importe a cobrar').props.editable).toBe(false);
  expect(field('Propina').props.editable).toBe(false);
  expect(button('Quitar propina').props.disabled).toBe(true);
  expect(button('Todo el cambio como propina').props.disabled).toBe(true);
  await act(async () => {
    field('Propina').props.onChangeText('9');
    button('Quitar propina').props.onPress();
    button('Todo el cambio como propina').props.onPress();
    queuedTipToggle();
  });
  expect(field('Propina').props.value).toBe('5');
  expect(tipToggle.props.accessibilityState.expanded).toBe(true);
  await act(async () => {
    release?.();
    await first;
  });
  expect(await services.transactions.list()).toHaveLength(1);
  expect((await services.transactions.list())[0].tipCents).toBe(500);
});

test('real write failure retains complete draft and retry uses the same pending UUID', async () => {
  let fail = false;
  services = await testPersistence(
    {
      ...db,
      transaction: work =>
        db.transaction(async tx => {
          await work(tx);
          if (fail) {
            throw new Error('Disk full');
          }
        }),
    },
    () => new Date(),
  );
  const save = jest.spyOn(services.transactions, 'save');
  await mount();
  await press('Bolt');
  await enter('18,50', '20');
  await tip(true);
  fail = true;
  await press('Confirmar cobro');
  expect(field('Importe a cobrar').props.value).toBe('18,50');
  expect(field('El cliente entrega').props.value).toBe('20');
  expect(button('Bolt').props.accessibilityState.selected).toBe(true);
  expect(tipValue()).toBe('1,50');
  expect(JSON.stringify(app.toJSON())).toContain('No se pudo guardar el cobro');
  expect(await services.transactions.list()).toEqual([]);
  fail = false;
  await press('Reintentar cobro');
  expect(save.mock.calls[0][0].id).toBe(save.mock.calls[1][0].id);
  expect(await services.transactions.list()).toHaveLength(1);
});

test('failed default-platform write preserves the active draft and committed default', async () => {
  let fail = false;
  services = await testPersistence(
    {
      ...db,
      transaction: work =>
        db.transaction(async tx => {
          await work(tx);
          if (fail) {
            throw new Error('Disk full');
          }
        }),
    },
    () => new Date(),
  );
  await mount();
  await press('Cabify');
  await enter('18', '20');
  await tip(true);
  fail = true;
  await press('Bolt');
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
  expect(field('Importe a cobrar').props.value).toBe('18');
  expect(tipValue()).toBe('2,00');
  expect((await services.preferences.read()).defaultPlatform).toBe('cabify');
  expect(JSON.stringify(app.toJSON())).toContain(
    'No se pudo guardar la preferencia',
  );
  fail = false;
  await press('Bolt');
  expect((await services.preferences.read()).defaultPlatform).toBe('bolt');
});

test('language/theme changes preserve raw draft, platform and tip while mounted', async () => {
  await mount();
  await press('Cabify');
  await enter('18.5', '20');
  await tip(true);
  await press('Ajustes');
  await press('English');
  await press('Dark');
  await press('Home');
  expect(field('Trip fare').props.value).toBe('18.5');
  expect(field('Cash received').props.value).toBe('20');
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
  expect(tipValue()).toBe('1,50');
  expect(JSON.stringify(app.toJSON())).toContain('#101714');
  await press('Settings');
  await press('Українська');
  await press('Головна');
  expect(field('Вартість поїздки').props.value).toBe('18.5');
  expect(tipValue()).toBe('1,50');
});

test('daily loading/error never render fake zero totals and retry loads genuine empty totals', async () => {
  let reject: ((reason: Error) => void) | undefined;
  const pendingRead = new Promise<never>((_, rejectRead) => {
    reject = rejectRead;
  });
  const list = services.transactions.list;
  jest
    .spyOn(services.transactions, 'list')
    .mockImplementationOnce(() => pendingRead)
    .mockImplementation(list);
  await mount();
  expect(app.root.findAllByProps({ testID: 'fareTotal' })).toHaveLength(0);
  await openSummary();
  expect(JSON.stringify(app.toJSON())).toContain('Cargando los totales');
  await act(async () => reject?.(new Error('Cannot read')));
  expect(app.root.findAllByProps({ testID: 'fareTotal' })).toHaveLength(0);
  expect(JSON.stringify(app.toJSON())).toContain('No se pudieron cargar');
  await press('Reintentar');
  expect(text('fareTotal')).toMatch(/0,00/);
  expect(text('daily-count')).toContain('0');
});

test.each(['success', 'error'])(
  'a stale daily %s cannot overwrite a newer committed summary',
  async outcome => {
    let resolveOld: ((rows: []) => void) | undefined;
    let rejectOld: ((error: Error) => void) | undefined;
    const oldRead = new Promise<[]>((resolve, reject) => {
      resolveOld = resolve;
      rejectOld = reject;
    });
    const list = services.transactions.list;
    jest
      .spyOn(services.transactions, 'list')
      .mockImplementationOnce(() => oldRead)
      .mockImplementation(list);
    await mount();
    await enter('20', '20');
    await press('Confirmar cobro');
    await openSummary();
    expect(text('fareTotal')).toMatch(/20,00/);
    await act(async () => {
      if (outcome === 'success') {
        resolveOld?.([]);
      } else {
        rejectOld?.(new Error('Stale failure'));
      }
    });
    expect(text('fareTotal')).toMatch(/20,00/);
    expect(JSON.stringify(app.toJSON())).not.toContain('No se pudieron cargar');
  },
);

test('daily totals update at local midnight and on resume, with subscription cleanup', async () => {
  const callbacks: ((state: AppStateStatus) => void)[] = [];
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
    callbacks.push(callback);
    return { remove };
  });
  await mount();
  await enter('20', '20');
  await press('Confirmar cobro');
  await openSummary();
  expect(text('fareTotal')).toMatch(/20,00/);
  await act(async () => {
    jest.setSystemTime(new Date('2026-10-09T00:00:00Z'));
    jest.advanceTimersByTime(1000);
  });
  expect(text('fareTotal')).toMatch(/0,00/);
  // A repository write bypasses refresh notifications, so only resume can load it.
  await createTransactionRepository(db).create({
    id: services.transactions.newPendingOperation().id,
    platform: 'uber',
    fareAmountCents: 1700,
    cashReceivedCents: 2000,
    changeGivenCents: 300,
    tipCents: 0,
    netCashCents: 1700,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  });
  expect(text('fareTotal')).toMatch(/0,00/);
  await act(async () => {
    callbacks.forEach(callback => callback('active'));
  });
  expect(text('fareTotal')).toMatch(/17,00/);
  await act(async () => app.unmount());
  expect(remove).toHaveBeenCalledTimes(callbacks.length);
});

test('summary starts hidden, toggles access and preserves fare and tip draft through rapid taps', async () => {
  await mount();
  expect(summaryToggle().props.accessibilityState.expanded).toBe(false);
  expect(summaryToggle().props.accessibilityLabel).toBe(
    'Hoy · Mostrar totales',
  );
  expect(summaryContent().props.pointerEvents).toBe('none');
  expect(summaryContent().props.accessibilityElementsHidden).toBe(true);
  expect(summaryContent().props.importantForAccessibility).toBe(
    'no-hide-descendants',
  );
  await enter('20', '50');
  await press('+ Añadir propina');
  await input('Propina', '5');
  await toggleSummary();
  expect(summaryContent().props.pointerEvents).toBe('auto');
  expect(summaryContent().props.accessibilityElementsHidden).toBe(false);
  expect(summaryToggle().props.accessibilityLabel).toBe(
    'Hoy · Ocultar totales',
  );
  await toggleSummary();
  expect(summaryToggle().props.accessibilityState.expanded).toBe(false);
  await act(async () => {
    summaryToggle().props.onPress();
    summaryToggle().props.onPress();
    summaryToggle().props.onPress();
  });
  expect(summaryToggle().props.accessibilityState.expanded).toBe(true);
  expect(field('Importe a cobrar').props.value).toBe('20');
  expect(field('El cliente entrega').props.value).toBe('50');
  expect(field('Propina').props.value).toBe('5');
  expect(text('change-result')).toMatch(/25,00/);
  await press('Confirmar cobro');
  expect(summaryToggle().props.accessibilityState.expanded).toBe(true);
  expect(text('fareTotal')).toMatch(/20,00/);
  expect(text('tipsTotal')).toMatch(/5,00/);
  expect(text('retainedCash')).toMatch(/25,00/);
});

test('navigation hides summary immediately without clearing the payment draft', async () => {
  await mount();
  await enter('18', '20');
  await tip(true);
  await openSummary();
  const previousReset = app.root.findByProps({
    testID: 'daily-summary-content',
  }).props.resetCount;
  await press('Ajustes');
  await press('Inicio');
  expect(summaryToggle().props.accessibilityState.expanded).toBe(false);
  expect(summaryContent().props.pointerEvents).toBe('none');
  expect(
    app.root.findByProps({ testID: 'daily-summary-content' }).props.resetCount,
  ).toBeGreaterThan(previousReset);
  expect(field('Importe a cobrar').props.value).toBe('18');
  expect(field('El cliente entrega').props.value).toBe('20');
  expect(tipValue()).toBe('2,00');
});

test.each(['inactive', 'background'] as const)(
  'summary hides on %s and stays hidden on resume',
  async nextState => {
    const callbacks: ((state: AppStateStatus) => void)[] = [];
    const remove = jest.fn();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_, callback) => {
        callbacks.push(callback);
        return { remove };
      });
    await mount();
    await enter('20', '50');
    await tip(true);
    await openSummary();
    const previousReset = app.root.findByProps({
      testID: 'daily-summary-content',
    }).props.resetCount;
    await act(async () => callbacks.forEach(callback => callback(nextState)));
    expect(summaryToggle().props.accessibilityState.expanded).toBe(false);
    expect(summaryContent().props.accessibilityElementsHidden).toBe(true);
    expect(
      app.root.findByProps({ testID: 'daily-summary-content' }).props
        .resetCount,
    ).toBeGreaterThan(previousReset);
    await act(async () => callbacks.forEach(callback => callback('active')));
    expect(summaryToggle().props.accessibilityState.expanded).toBe(false);
    expect(field('Importe a cobrar').props.value).toBe('20');
    expect(tipValue()).toBe('30,00');
    await act(async () => app.unmount());
    expect(remove).toHaveBeenCalledTimes(callbacks.length);
  },
);
