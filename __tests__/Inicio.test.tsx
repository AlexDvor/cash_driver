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
function text(id: string): string {
  return String(app.root.findByProps({ testID: id }).props.children);
}
async function tip(enabled: boolean) {
  const toggle = button('El cambio es propina');
  if (toggle.props.accessibilityState.checked !== enabled) {
    await act(async () => toggle.props.onPress());
  }
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
  expect(app.root.findByType(Switch).props.value).toBe(false);
  await tip(true);
  await press('50,00 €');
  expect(field('El cliente entrega').props.value).toBe('50,00');
  expect(text('change-result')).toMatch(/32,60/);
  await tip(true);
  await input('Importe a cobrar', '18');
  expect(app.root.findByType(Switch).props.value).toBe(false);
  await tip(true);
  await input('El cliente entrega', '100');
  expect(app.root.findByType(Switch).props.value).toBe(false);
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
  const confirm = button('Confirmar cobro');
  let first: Promise<void> | undefined;
  await act(async () => {
    first = confirm.props.onPress();
    confirm.props.onPress();
  });
  expect(spy).toHaveBeenCalledTimes(1);
  expect(button('Guardando cobro…').props.disabled).toBe(true);
  expect(field('Importe a cobrar').props.editable).toBe(false);
  await act(async () => {
    release?.();
    await first;
  });
  expect(await services.transactions.list()).toHaveLength(1);
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
  expect(app.root.findByType(Switch).props.value).toBe(true);
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
  expect(app.root.findByType(Switch).props.value).toBe(true);
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
  expect(app.root.findByType(Switch).props.value).toBe(true);
  expect(JSON.stringify(app.toJSON())).toContain('#101714');
  await press('Settings');
  await press('Українська');
  await press('Головна');
  expect(field('Вартість поїздки').props.value).toBe('18.5');
  expect(app.root.findByType(Switch).props.value).toBe(true);
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
