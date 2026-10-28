import { summarizeTransactions } from '../../features/summary/summary';
import React from 'react';
import { DailySummarySkeleton } from '../../components/DailySummary/DailySummarySkeleton';
import type { CashTransaction } from '../../features/transactions/types';
import {
  AppState,
  AppStateStatus,
  Keyboard,
  Switch,
  StyleSheet,
  TextInput,
} from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../../../App';
import { createTransactionRepository } from '../../features/transactions/transactionRepository';
import { SqlConnection } from '../../database/sqlite';
import { Persistence } from '../../app/persistence';
import {
  openTestDatabase,
  testPersistence,
} from '../../test/sqliteTestDatabase';
import { PlatformIcon } from '../../components/PlatformIcon/PlatformIcon';
import { PaymentForm } from '../../components/PaymentForm/PaymentForm';
import { PaymentOutcome } from '../../components/PaymentOutcome/PaymentOutcome';
import { ScrollView } from 'react-native';

let db: SqlConnection;
let services: Persistence;
let app: ReactTestRenderer.ReactTestRenderer;
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-08T10:00:00Z'));
  db = openTestDatabase();
  services = await testPersistence(db, () => new Date());
  await services.preferences.update({
    enabledPlatforms: ['uber', 'cabify', 'bolt', 'other'],
  });
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
async function toggleWorkingPlatform(label: string) {
  const choice = app.root.find(
    node =>
      node.props.accessibilityRole === 'checkbox' &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  );
  await act(async () => choice.props.onPress());
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

test('cancel reveals for sufficient valid amounts, clears tips and never saves a cancelled draft', async () => {
  await mount();
  const cancelSection = () =>
    app.root
      .findAllByProps({ testID: 'cancel-payment-section' })
      .find(node => node.props.pointerEvents !== undefined)!;
  expect(cancelSection().props.pointerEvents).toBe('none');
  expect(cancelSection().props.accessibilityElementsHidden).toBe(true);
  await input('Importe a cobrar', '20');
  expect(cancelSection().props.pointerEvents).toBe('none');
  await input('El cliente entrega', '10');
  expect(cancelSection().props.pointerEvents).toBe('none');
  await input('El cliente entrega', '50');
  expect(cancelSection().props.pointerEvents).toBe('auto');
  await press('+ Añadir propina');
  await input('Propina', 'bad');
  // Cancellation depends on fare/received, so an invalid tip can still be discarded.
  expect(cancelSection().props.pointerEvents).toBe('auto');
  const staleForm = app.root.findByType(PaymentForm).props.form;
  await press('Cancelar cobro');
  await act(async () => staleForm.blur('received'));
  let staleSubmitted = true;
  await act(async () => {
    staleSubmitted = await staleForm.submit();
  });
  expect(staleSubmitted).toBe(false);
  expect(field('Importe a cobrar').props.value).toBe('');
  expect(field('El cliente entrega').props.value).toBe('');
  expect(field('Propina').props.value).toBe('');
  expect(
    app.root.findByProps({ testID: 'tip-section-toggle' }).props
      .accessibilityState.expanded,
  ).toBe(false);
  expect(cancelSection().props.pointerEvents).toBe('none');
  expect(text('change-result')).toMatch(/0,00/);
  expect(await services.transactions.list()).toHaveLength(0);
});

test('cancelling a failed payment discards its retry identity before entering the same amounts again', async () => {
  const pending = jest.spyOn(services.transactions, 'newPendingOperation');
  jest
    .spyOn(services.transactions, 'save')
    .mockRejectedValueOnce(new Error('Disk full'));
  await mount();
  await enter('20', '50');
  await press('Confirmar cobro');
  expect(pending).toHaveBeenCalledTimes(1);
  await press('Cancelar cobro');
  await enter('20', '50');
  await press('Confirmar cobro');
  expect(pending).toHaveBeenCalledTimes(2);
  expect(await services.transactions.list()).toHaveLength(1);
});

test('measured money fields stack when width is insufficient without losing the draft', async () => {
  await mount();
  await enter('20', '50');
  const fields = () => app.root.findByProps({ testID: 'payment-money-fields' });
  await act(async () => {
    app.root
      .findByProps({ testID: 'payment-money-measure' })
      .props.onTextLayout({ nativeEvent: { lines: [{ width: 120 }] } });
    fields().props.onLayout({ nativeEvent: { layout: { width: 400 } } });
  });
  expect(StyleSheet.flatten(fields().props.style).flexDirection).toBe('row');
  await act(async () =>
    fields().props.onLayout({ nativeEvent: { layout: { width: 250 } } }),
  );
  expect(StyleSheet.flatten(fields().props.style).flexDirection).not.toBe(
    'row',
  );
  expect(field('Importe a cobrar').props.value).toBe('20');
  expect(field('El cliente entrega').props.value).toBe('50');
  expect(text('change-result')).toMatch(/30,00/);
});

test('receipt follows valid amounts, selected banknotes and collapsed tips without saving', async () => {
  await mount();
  expect(text('change-result')).toMatch(/0,00/);
  expect(button('Confirmar cobro').props.accessibilityState.disabled).toBe(
    true,
  );
  expect(
    app.root.findAllByProps({ testID: 'payment-receipt-details' }),
  ).toHaveLength(0);
  await enter('20', '50');
  expect(text('receipt-fare')).toMatch(/20,00/);
  expect(text('receipt-received')).toMatch(/50,00/);
  expect(text('change-result')).toMatch(/30,00/);
  expect(button('50,00 €').props.accessibilityState.selected).toBe(true);
  expect(app.root.findAllByProps({ testID: 'receipt-tip' })).toHaveLength(0);
  await press('+ Añadir propina');
  await input('Propina', '5');
  expect(text('receipt-tip')).toMatch(/5,00/);
  expect(text('change-result')).toMatch(/25,00/);
  await act(async () =>
    app.root.findByProps({ testID: 'tip-section-toggle' }).props.onPress(),
  );
  expect(text('tip-amount-badge')).toMatch(/5,00/);
  expect(text('receipt-tip')).toMatch(/5,00/);
  await press('50,00 €');
  expect(app.root.findAllByProps({ testID: 'receipt-tip' })).toHaveLength(0);
  expect(text('change-result')).toMatch(/30,00/);
  await input('El cliente entrega', '10');
  expect(button('50,00 €').props.accessibilityState.selected).toBe(false);
  expect(
    app.root.findAllByProps({ testID: 'payment-receipt-details' }),
  ).toHaveLength(0);
  expect(text('change-result')).toMatch(/10,00/);
  expect(await services.transactions.list()).toHaveLength(0);
});

test('receipt hides unfinished and excessive tips and header count follows committed payments', async () => {
  await mount();
  expect(
    String(
      app.root.findByProps({ testID: 'daily-header-count' }).props.children,
    ),
  ).toContain('0');
  await enter('20', '50');
  await press('+ Añadir propina');
  await input('Propina', '5,');
  expect(text('change-result')).toBe('—');
  expect(
    app.root.findAllByProps({ testID: 'payment-receipt-details' }),
  ).toHaveLength(0);
  await input('Propina', '31');
  expect(app.root.findAllByProps({ testID: 'tip-amount-badge' })).toHaveLength(
    0,
  );
  expect(
    app.root.findAllByProps({ testID: 'payment-receipt-details' }),
  ).toHaveLength(0);
  await input('Propina', '5');
  await press('Confirmar cobro');
  expect(
    String(
      app.root.findByProps({ testID: 'daily-header-count' }).props.children,
    ),
  ).toContain('1');
  expect(
    app.root.findAllByProps({ testID: 'payment-receipt-details' }),
  ).toHaveLength(0);
  expect(app.root.findAllByProps({ testID: 'payment-success' })).toHaveLength(
    0,
  );
});

test.each(['50,00 €', 'Exacto'])(
  'quick shortcut %s uses the received idle dismissal without saving',
  async label => {
    const originalState = AppState.currentState;
    AppState.currentState = 'active';
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    try {
      await mount();
      await input('Importe a cobrar', '18');
      await press(label);
      expect(field('El cliente entrega').props.value).toBe(
        label === 'Exacto' ? '18,00' : '50,00',
      );
      await act(async () => jest.advanceTimersByTime(1999));
      expect(Keyboard.dismiss).not.toHaveBeenCalled();
      await act(async () => jest.advanceTimersByTime(1));
      expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
      expect(await services.transactions.list()).toHaveLength(0);
    } finally {
      AppState.currentState = originalState;
    }
  },
);
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
      ['Propina', 'Tip', 'Propinas'].includes(node.props.accessibilityLabel),
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

test('change and confirmation stay in scrolling content with only one save action', async () => {
  await mount();
  const scroll = app.root
    .findAllByType(ScrollView)
    .find(node => node.findAllByType(PaymentForm).length > 0);
  expect(scroll?.findAllByType(PaymentOutcome)).toHaveLength(1);
  expect(app.root.findAllByType(PaymentOutcome)).toHaveLength(1);
});

test('tip input focus requests scrolling without changing the draft or saving', async () => {
  await mount();
  await enter('18', '20');
  await act(async () =>
    app.root.findByProps({ testID: 'tip-section-toggle' }).props.onPress(),
  );
  const navigation = app.root.findByType(PaymentForm).props.entryNavigation;
  const focus = jest.spyOn(navigation, 'focus');
  await input('Propina', '1');
  expect(focus).toHaveBeenCalledWith('tip');
  const blur = jest.spyOn(
    app.root.findByType(PaymentForm).props.entryNavigation,
    'blur',
  );
  await act(async () => field('Propina').props.onBlur());
  expect(blur).toHaveBeenCalledWith('tip');
  expect(field('Importe a cobrar').props.value).toBe('18');
  expect(field('El cliente entrega').props.value).toBe('20');
  expect(tipValue()).toBe('1,00');
  expect(await services.transactions.list()).toHaveLength(0);
});

test('opening the tip section requests upward scroll without focusing an input', async () => {
  await mount();
  const navigation = app.root.findByType(PaymentForm).props.entryNavigation;
  const open = jest.spyOn(navigation, 'openTip');
  const focus = jest.spyOn(navigation, 'focus');
  await act(async () =>
    app.root.findByProps({ testID: 'tip-section-toggle' }).props.onPress(),
  );
  expect(open).toHaveBeenCalledTimes(1);
  expect(focus).not.toHaveBeenCalled();
  expect(field('Importe a cobrar').props.value).toBe('');
  expect(tipValue()).toBe('');
  expect(await services.transactions.list()).toHaveLength(0);
});

test('ordinary change, exact and insufficient cash are immediate; malformed/zero/over-limit amounts cannot confirm', async () => {
  await mount();
  for (const platform of ['Uber', 'Cabify', 'Bolt', 'Taxi']) {
    expect(button(platform).findByType(PlatformIcon).props.platform).toBe(
      platform === 'Taxi' ? 'other' : platform.toLowerCase(),
    );
  }
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
  expect(app.root.findAllByProps({ testID: 'payment-success' })).toHaveLength(
    0,
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
  expect(button('Cancelar cobro').props.disabled).toBe(true);
  await act(async () => button('Cancelar cobro').props.onPress());
  expect(field('Importe a cobrar').props.value).toBe('20');
  expect(field('El cliente entrega').props.value).toBe('50');
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
  await press('Ajustes');
  await toggleWorkingPlatform('Bolt');
  await press('Inicio');
  expect(button('Reintentar cobro').props.disabled).toBe(true);
  await act(async () => button('Reintentar cobro').props.onPress());
  expect(save).toHaveBeenCalledTimes(1);
  expect(field('Importe a cobrar').props.value).toBe('18,50');
  expect(tipValue()).toBe('1,50');
  await press('Ajustes');
  await toggleWorkingPlatform('Bolt');
  await press('Inicio');
  expect(button('Reintentar cobro').props.disabled).toBe(false);
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
  fail = false;
  expect((await services.preferences.read()).defaultPlatform).toBe('cabify');
  expect(JSON.stringify(app.toJSON())).toContain(
    'No se pudo guardar la preferencia',
  );
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
  await press('Español');
  await press('Inicio');
  expect(field('Importe a cobrar').props.value).toBe('18.5');
  expect(tipValue()).toBe('1,50');
});

test('daily loading/error never render fake zero totals and retry loads genuine empty totals', async () => {
  let reject: ((reason: Error) => void) | undefined;
  const pendingRead = new Promise<never>((_, rejectRead) => {
    reject = rejectRead;
  });
  const list = services.transactions.summarizeCompatible;
  jest
    .spyOn(services.transactions, 'summarizeCompatible')
    .mockImplementationOnce(() => pendingRead)
    .mockImplementation(list);
  await mount();
  expect(app.root.findAllByProps({ testID: 'fareTotal' })).toHaveLength(0);
  expect(app.root.findAllByType(DailySummarySkeleton)).toHaveLength(1);
  await openSummary();
  expect(JSON.stringify(app.toJSON())).toContain('Cargando los totales');
  await act(async () => reject?.(new Error('Cannot read')));
  expect(app.root.findAllByType(DailySummarySkeleton)).toHaveLength(0);
  expect(app.root.findAllByProps({ testID: 'fareTotal' })).toHaveLength(0);
  expect(JSON.stringify(app.toJSON())).toContain('No se pudieron cargar');
  await press('Reintentar');
  expect(app.root.findAllByType(DailySummarySkeleton)).toHaveLength(0);
  expect(text('fareTotal')).toMatch(/0,00/);
  expect(text('daily-count')).toContain('0');
  let finishRefresh: (rows: CashTransaction[]) => void = () => {};
  const refreshRead = new Promise<CashTransaction[]>(resolve => {
    finishRefresh = resolve;
  });
  jest
    .spyOn(services.transactions, 'summarizeCompatible')
    .mockImplementationOnce(() => refreshRead.then(summarizeTransactions));
  await act(async () => services.changes.notify('transactions'));
  expect(app.root.findAllByType(DailySummarySkeleton)).toHaveLength(0);
  expect(JSON.stringify(app.toJSON())).toContain('Actualizando');
  expect(text('daily-count')).toContain('0');
  await act(async () => finishRefresh([]));
  expect(text('daily-count')).toContain('0');
});

test('daily refresh failure retains labeled totals and payment draft through Retry', async () => {
  await mount();
  await enter('20', '20');
  await press('Confirmar cobro');
  await openSummary();
  await enter('18', '50');
  await tip(true);
  const fareInput = field('Importe a cobrar');
  const receivedInput = field('El cliente entrega');
  const draftTip = tipValue();
  let failRefresh: (error: Error) => void = () => {};
  const pending = new Promise<CashTransaction[]>((_resolve, reject) => {
    failRefresh = reject;
  });
  jest
    .spyOn(services.transactions, 'summarizeCompatible')
    .mockReturnValueOnce(pending.then(summarizeTransactions));
  await act(async () => services.changes.notify('transactions'));
  expect(text('fareTotal')).toMatch(/20,00/);
  expect(app.root.findAllByType(DailySummarySkeleton)).toHaveLength(0);
  expect(JSON.stringify(app.toJSON())).toContain('Actualizando');
  await act(async () => failRefresh(Error('read failed')));
  expect(text('fareTotal')).toMatch(/20,00/);
  expect(JSON.stringify(app.toJSON())).toContain(
    'Datos anteriores; actualización fallida',
  );
  expect(field('Importe a cobrar')).toBe(fareInput);
  expect(field('El cliente entrega')).toBe(receivedInput);
  expect(fareInput.props.value).toBe('18');
  expect(receivedInput.props.value).toBe('50');
  expect(tipValue()).toBe(draftTip);
  await press('Reintentar');
  expect(text('fareTotal')).toMatch(/20,00/);
  expect(JSON.stringify(app.toJSON())).not.toContain(
    'Datos anteriores; actualización fallida',
  );
  expect(fareInput.props.value).toBe('18');
  expect(tipValue()).toBe(draftTip);
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
    const list = services.transactions.summarizeCompatible;
    jest
      .spyOn(services.transactions, 'summarizeCompatible')
      .mockImplementationOnce(() => oldRead.then(summarizeTransactions))
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
  expect(
    summaryToggle().findByProps({ testID: 'daily-summary-title' }).props
      .children,
  ).toBe('Resumen de hoy');
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
  expect(
    summaryToggle().findByProps({ testID: 'daily-summary-title' }).props
      .children,
  ).toBe('Resumen de hoy');
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
