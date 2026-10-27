import React from 'react';
import {
  Alert,
  AppState,
  TextInput,
  Switch,
  NativeModules,
  View,
} from 'react-native';
import { SettingsIcon } from '../../components/SettingsIcon/SettingsIcon';
import { CalendarActivityFeedback } from '../../components/CalendarModal/CalendarActivityFeedback';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../../navigation/AppNavigator';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { PersistenceProvider } from '../../providers/PersistenceProvider/PersistenceProvider';
import { Persistence } from '../../app/persistence';
import { LanguageProvider } from '../../providers/LanguageProvider/LanguageProvider';
import { ThemeProvider } from '../../providers/ThemeProvider/ThemeProvider';
import { SqlConnection } from '../../database/sqlite';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from '../../test/sqliteTestDatabase';
import { CashTransaction } from '../../features/transactions/types';

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
  delete NativeModules.CashDriverConfirmationSound;
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
  return JSON.stringify(app.toJSON(), (_key, value: unknown) =>
    React.isValidElement(value) ? undefined : value,
  );
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
    await press('Vibración al guardar');
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
  expect(content()).toContain('1.0');
  expect(content()).not.toContain('package JavaScript');
  expect(switchValue()).toBe(false);
  await press('Cabify');
  await toggle(true);
  await press('English');
  await press('Dark');
  const saved = await services.preferences.read();
  expect(saved).toEqual({
    language: 'en',
    themeMode: 'dark',
    defaultPlatform: 'uber',
    enabledPlatforms: ['uber', 'cabify'],
    hapticsEnabled: true,
    soundEnabled: true,
  });
  await act(async () => app.unmount());
  await mount();
  await press('Settings');
  expect(content()).toContain('Data stays only on this device');
  expect(button('Dark').props.accessibilityState.selected).toBe(true);
  expect(button('Cabify').props.accessibilityState.checked).toBe(true);
  expect(await services.preferences.read()).toEqual(saved);
});

test('section and control icons are decorative and theme icons follow the selected option', async () => {
  await mount();
  await press('Ajustes');
  const icons = () => app.root.findAllByType(SettingsIcon);
  expect(icons().map(icon => icon.props.name)).toEqual([
    'palette',
    'sun',
    'moon',
    'phone',
    'briefcase',
    'info',
    'database',
    'trash',
  ]);
  for (const icon of icons()) {
    const wrapper = icon.findByType(View);
    expect(wrapper.props.accessible).toBe(false);
    expect(wrapper.props.accessibilityElementsHidden).toBe(true);
    expect(wrapper.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(wrapper.props.pointerEvents).toBe('none');
  }
  await press('Oscuro');
  const moon = icons().find(icon => icon.props.name === 'moon')!;
  const sun = icons().find(icon => icon.props.name === 'sun')!;
  const trash = icons().find(icon => icon.props.name === 'trash')!;
  expect(moon.props.color).not.toBe(sun.props.color);
  expect(trash.props.color).not.toBe(moon.props.color);
  expect(button('Oscuro').props.accessibilityState.selected).toBe(true);
});

test('theme explanation follows the committed mode and a failed write keeps the prior explanation', async () => {
  await mount();
  await press('Ajustes');
  expect(content()).toContain(
    'Sin ubicación disponible: se usa el tema del dispositivo.',
  );
  await press('Oscuro');
  expect(content()).toContain('Tema oscuro activado.');
  expect(content()).not.toContain(
    'Sin ubicación disponible: se usa el tema del dispositivo.',
  );
  await press('Claro');
  expect(content()).toContain('Tema claro activado.');
  jest
    .spyOn(services.preferences, 'update')
    .mockRejectedValueOnce(new Error('write failed'));
  await press('Oscuro');
  expect(content()).toContain('Tema claro activado.');
  expect(content()).not.toContain('Tema oscuro activado.');
  expect((await services.preferences.read()).themeMode).toBe('light');
  await press('Automático');
  expect(content()).toContain(
    'Sin ubicación disponible: se usa el tema del dispositivo.',
  );
});

test('haptics has one accessible switch and one press persists one toggle', async () => {
  await mount();
  await press('Ajustes');
  const update = jest.spyOn(services.preferences, 'update');
  const switches = app.root.findAll(
    node =>
      node.props.accessibilityRole === 'switch' &&
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel === 'Vibración al guardar',
  );
  expect(switches).toHaveLength(1);
  await press('Vibración al guardar');
  expect(update).toHaveBeenCalledTimes(1);
  expect(switchValue()).toBe(true);
  expect((await services.preferences.read()).hapticsEnabled).toBe(true);
});

test('sound has one accessible switch, toggles once and stays disabled after remount', async () => {
  await mount();
  await press('Ajustes');
  const update = jest.spyOn(services.preferences, 'update');
  expect(button('Sonido al guardar').props.accessibilityState.checked).toBe(
    true,
  );
  const switches = app.root.findAll(
    node =>
      node.props.accessibilityRole === 'switch' &&
      node.props.accessibilityLabel === 'Sonido al guardar' &&
      typeof node.props.onPress === 'function',
  );
  expect(switches).toHaveLength(1);
  await press('Sonido al guardar');
  expect(update).toHaveBeenCalledTimes(1);
  expect((await services.preferences.read()).soundEnabled).toBe(false);
  expect(
    app.root.findByProps({ testID: 'settings-sound-switch' }).props.accessible,
  ).toBe(false);
  await act(async () => app.unmount());
  await mount();
  await press('Ajustes');
  expect(button('Sonido al guardar').props.accessibilityState.checked).toBe(
    false,
  );
});

test('sound failure cannot fail a committed payment; disabled sound and duplicate taps never replay', async () => {
  const play = jest.fn(() => {
    throw new Error('Audio unavailable');
  });
  NativeModules.CashDriverConfirmationSound = { play };
  await mount();
  await input('Importe a cobrar', '18');
  await input('El cliente entrega', '20');
  const confirm = button('Confirmar cobro').props.onPress;
  await act(async () => {
    await Promise.all([confirm(), confirm()]);
  });
  expect(play).toHaveBeenCalledTimes(1);
  expect(await services.transactions.list()).toHaveLength(1);
  expect(field('Importe a cobrar').props.value).toBe('');
  await press('Ajustes');
  await press('Sonido al guardar');
  await press('Inicio');
  await input('Importe a cobrar', '10');
  await input('El cliente entrega', '10');
  await press('Confirmar cobro');
  expect(play).toHaveBeenCalledTimes(1);
  expect(await services.transactions.list()).toHaveLength(2);
});

test('working platforms support one through four choices and protect the last choice', async () => {
  await mount();
  await press('Ajustes');
  expect(content()).toContain('Plataformas de trabajo');
  expect(content()).toContain('Selecciona al menos una plataforma');
  expect(button('Uber').props.accessibilityRole).toBe('checkbox');
  expect(button('Uber').props.accessibilityState).toMatchObject({
    checked: true,
    disabled: true,
  });
  expect(button('Uber').props.accessibilityHint).toBe(
    'Selecciona al menos una plataforma.',
  );
  await press('Bolt');
  expect(await services.preferences.read()).toMatchObject({
    defaultPlatform: 'uber',
    enabledPlatforms: ['uber', 'bolt'],
  });
  expect(button('Uber').props.accessibilityState.disabled).toBe(false);
  await press('Cabify');
  await press('Otro');
  expect((await services.preferences.read()).enabledPlatforms).toEqual([
    'uber',
    'cabify',
    'bolt',
    'other',
  ]);
  await press('Uber');
  expect((await services.preferences.read()).enabledPlatforms).toEqual([
    'cabify',
    'bolt',
    'other',
  ]);
  await press('Bolt');
  await press('Otro');
  expect(await services.preferences.read()).toMatchObject({
    defaultPlatform: 'cabify',
    enabledPlatforms: ['cabify'],
  });
  expect(button('Cabify').props.accessibilityState).toMatchObject({
    checked: true,
    disabled: true,
  });
  await act(async () => app.unmount());
  await mount();
  await press('Ajustes');
  expect(button('Cabify').props.accessibilityState.checked).toBe(true);
  expect(button('Bolt').props.accessibilityState.checked).toBe(false);
});

test('removing the saved default chooses the first remaining platform without touching transactions', async () => {
  const row = await seed('bolt');
  await mount();
  await press('Ajustes');
  await press('Bolt');
  await press('Inicio');
  await press('Bolt');
  await press('Ajustes');
  await press('Cabify');
  await press('Bolt');
  await press('Uber');
  expect(await services.preferences.read()).toMatchObject({
    defaultPlatform: 'cabify',
    enabledPlatforms: ['cabify'],
  });
  expect(await services.transactions.get(row.id)).toEqual(row);
});

test('working-platform labels and minimum-selection explanation follow the language', async () => {
  await mount();
  await press('Ajustes');
  await press('English');
  expect(content()).toContain('Working platforms');
  expect(content()).toContain('Select at least one platform');
  await press('Español');
  expect(content()).toContain('Plataformas de trabajo');
  expect(content()).toContain('Selecciona al menos una plataforma');
  expect(button('Uber').props.accessibilityHint).toBe(
    'Selecciona al menos una plataforma.',
  );
});

test('Settings list preserves Home draft; edit leaves default unchanged', async () => {
  const row = await seed();
  await services.preferences.update({ enabledPlatforms: ['uber', 'cabify'] });
  await mount();
  await press('Cabify');
  await input('Importe a cobrar', '18.5');
  await input('El cliente entrega', '20');
  await press('+ Añadir propina');
  await press('Todo el cambio como propina');
  await press('Ajustes');
  await press('Bolt');
  await press('English');
  await press('Dark');
  await press('Home');
  expect(field('Trip fare').props.value).toBe('18.5');
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
  expect(field('Tip').props.value).toBe('1,50');
  await press('Bolt');
  expect((await services.preferences.read()).defaultPlatform).toBe('bolt');
  await edit(row.id);
  await input('Trip fare', '19');
  await press('Save changes');
  expect((await services.preferences.read()).defaultPlatform).toBe('bolt');
  await press('Cancel');
  await act(async () => ref.goBack());
  await press('Settings');
  expect(button('Bolt').props.accessibilityState.checked).toBe(true);
});

test('Home shows only working platforms and requires reselection for a disabled dirty draft', async () => {
  await mount();
  const homeChoices = () => [
    ...new Set(
      app.root
        .findAll(
          node =>
            node.props.accessibilityRole === 'radio' &&
            ['Uber', 'Cabify', 'Bolt', 'Otro'].includes(
              node.props.accessibilityLabel,
            ),
        )
        .map(node => node.props.accessibilityLabel),
    ),
  ];
  expect(homeChoices()).toEqual(['Uber']);
  expect(button('Uber').props.accessibilityState.selected).toBe(true);
  await press('Ajustes');
  await press('Cabify');
  await press('Inicio');
  expect(homeChoices()).toEqual(['Uber', 'Cabify']);
  await input('Importe a cobrar', '18.5');
  await input('El cliente entrega', '20');
  await press('+ Añadir propina');
  await press('Todo el cambio como propina');
  await press('Ajustes');
  await press('Uber');
  expect(await services.preferences.read()).toMatchObject({
    defaultPlatform: 'cabify',
    enabledPlatforms: ['cabify'],
  });
  await press('Inicio');
  expect(homeChoices()).toEqual(['Cabify']);
  expect(button('Cabify').props.accessibilityState.selected).toBe(false);
  expect(field('Importe a cobrar').props.value).toBe('18.5');
  expect(field('El cliente entrega').props.value).toBe('20');
  expect(field('Propina').props.value).toBe('1,50');
  expect(content()).toContain('Elige una plataforma disponible');
  expect(button('Confirmar cobro').props.disabled).toBe(true);
  await act(async () => button('Confirmar cobro').props.onPress());
  expect(await services.transactions.list()).toHaveLength(0);
  await press('Cabify');
  expect(field('Importe a cobrar').props.value).toBe('18.5');
  expect(field('Propina').props.value).toBe('1,50');
  await press('Confirmar cobro');
  expect((await services.transactions.list())[0]).toMatchObject({
    platform: 'cabify',
    fareAmountCents: 1850,
    tipCents: 150,
  });
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
});

test.each([
  [['uber'], ['Uber']],
  [
    ['uber', 'bolt'],
    ['Uber', 'Bolt'],
  ],
  [
    ['uber', 'cabify', 'bolt'],
    ['Uber', 'Cabify', 'Bolt'],
  ],
  [
    ['uber', 'cabify', 'bolt', 'other'],
    ['Uber', 'Cabify', 'Bolt', 'Otro'],
  ],
] as const)(
  'Home renders the committed %j platform set',
  async (enabled, labels) => {
    await services.preferences.update({ enabledPlatforms: [...enabled] });
    await mount();
    const visible = [
      ...new Set(
        app.root
          .findAll(
            node =>
              node.props.accessibilityRole === 'radio' &&
              ['Uber', 'Cabify', 'Bolt', 'Otro'].includes(
                node.props.accessibilityLabel,
              ),
          )
          .map(node => node.props.accessibilityLabel),
      ),
    ];
    expect(visible).toEqual(labels);
    expect(button('Uber').props.accessibilityState.selected).toBe(true);
  },
);

test('pristine Home form follows a changed default after Settings disables its old platform', async () => {
  await mount();
  await press('+ Añadir propina');
  await press('Ajustes');
  await press('Cabify');
  await press('Uber');
  await press('Inicio');
  expect(button('Cabify').props.accessibilityState.selected).toBe(true);
  expect(
    app.root.findByProps({ testID: 'tip-section-toggle' }).props
      .accessibilityState.expanded,
  ).toBe(true);
  expect(content()).not.toContain('Elige una plataforma disponible');
  expect((await services.preferences.read()).defaultPlatform).toBe('cabify');
});

test('two-platform payments remain in history and summary after disabling one, editing it and restarting', async () => {
  await mount();
  await press('Ajustes');
  await press('Bolt');
  await press('Inicio');
  await input('Importe a cobrar', '10');
  await input('El cliente entrega', '20');
  await press('Confirmar cobro');
  await press('Bolt');
  await input('Importe a cobrar', '12');
  await input('El cliente entrega', '20');
  await press('Confirmar cobro');
  const records = await services.transactions.list();
  expect(records).toHaveLength(2);
  const bolt = records.find(record => record.platform === 'bolt');
  expect(bolt).toMatchObject({ fareAmountCents: 1200 });
  if (!bolt) throw new Error('Missing Bolt payment');
  await press('Ajustes');
  await press('Bolt');
  await press('Inicio');
  expect(button('Uber').props.accessibilityState.selected).toBe(true);
  expect(
    app.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        node.props.accessibilityLabel === 'Bolt',
    ),
  ).toHaveLength(0);
  await press('Historial');
  expect(rowIds()).toHaveLength(2);
  await details(bolt.id);
  expect(content()).toContain('Bolt');
  await press('Editar');
  await input('Importe a cobrar', '13');
  await press('Guardar cambios');
  expect(await services.transactions.get(bolt.id)).toMatchObject({
    platform: 'bolt',
    fareAmountCents: 1300,
  });
  expect((await services.preferences.read()).enabledPlatforms).toEqual([
    'uber',
  ]);
  await act(async () => ref.goBack());
  await act(async () => ref.goBack());
  await press('Resumen');
  expect(content()).toContain('Bolt');
  expect(content()).toContain('13,00');
  await act(async () => app.unmount());
  await mount();
  expect((await services.preferences.read()).enabledPlatforms).toEqual([
    'uber',
  ]);
  expect(await services.transactions.list()).toHaveLength(2);
  await press('Historial');
  expect(rowIds()).toHaveLength(2);
});

test.each(['language', 'theme', 'platform', 'haptics', 'sound'])(
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
    if (kind === 'sound') {
      await press('Sonido al guardar');
    }
    expect(await services.preferences.read()).toEqual(original);
    expect(content()).toContain('No se pudo guardar');
    expect(switchValue()).toBe(false);
    await db.execute('DROP TRIGGER reject_preferences');
    await press('Reintentar preferencia');
    const changes = {
      language: { language: 'en' },
      theme: { themeMode: 'dark' },
      platform: { enabledPlatforms: ['uber', 'bolt'] },
      haptics: { hapticsEnabled: true },
      sound: { soundEnabled: false },
    };
    expect(await services.preferences.read()).toMatchObject(
      changes[kind as keyof typeof changes],
    );
  },
);

test('saving preference disables controls and retains committed state until write finishes', async () => {
  await mount();
  await press('Ajustes');
  const progress = app.root.findByType(CalendarActivityFeedback);
  expect(progress.props.status).toBe('ready');
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
  expect(app.root.findByType(CalendarActivityFeedback)).toBe(progress);
  expect(progress.props.status).toBe('loading');
  expect(progress.props.message).toContain('Guardando preferencia');
  expect(await services.preferences.read()).toMatchObject({ language: 'es' });
  await act(async () => {
    release();
    await gate;
  });
  expect(content()).toContain('Currency');
  expect(app.root.findByType(CalendarActivityFeedback)).toBe(progress);
  expect(progress.props.status).toBe('ready');
});

test('working-platform write blocks rapid taps and keeps the committed list until completion', async () => {
  await mount();
  await press('Ajustes');
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const update = services.preferences.update;
  const write = jest
    .spyOn(services.preferences, 'update')
    .mockImplementation(async patch => {
      await gate;
      return update(patch);
    });
  await act(async () => {
    button('Bolt').props.onPress();
    button('Cabify').props.onPress();
  });
  expect(write).toHaveBeenCalledTimes(1);
  expect(button('Bolt').props.accessibilityState.disabled).toBe(true);
  expect(button('Cabify').props.accessibilityState.disabled).toBe(true);
  expect((await services.preferences.read()).enabledPlatforms).toEqual([
    'uber',
  ]);
  await act(async () => {
    release();
    await gate;
  });
  expect((await services.preferences.read()).enabledPlatforms).toEqual([
    'uber',
    'bolt',
  ]);
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
  expect(content()).not.toContain('Cobro registrado');
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
