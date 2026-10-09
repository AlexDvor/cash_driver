import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  PersistenceProvider,
  usePersistence,
} from '../src/providers/PersistenceProvider/PersistenceProvider';
import { LanguageProvider, useTranslation } from '../src/providers/LanguageProvider/LanguageProvider';
import { ThemeProvider, useAppTheme } from '../src/providers/ThemeProvider/ThemeProvider';
import { useDataChanges } from '../src/hooks/app/useDataChanges';
import { SqlConnection } from '../src/database/sqlite';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';

let db: SqlConnection;
let app: ReactTestRenderer.ReactTestRenderer | undefined;
beforeEach(() => {
  db = openTestDatabase();
});
afterEach(async () => {
  await act(async () => app?.unmount());
  app = undefined;
  db.close();
});

function Probe() {
  const { preferences, updatePreferences, saving, errorKey } = usePersistence();
  const { language } = useTranslation();
  const { mode, appearance } = useAppTheme();
  return (
    <Text
      testID="probe"
      onPress={() => updatePreferences({ language: 'en', themeMode: 'light' })}
    >
      {JSON.stringify({
        preferences,
        language,
        mode,
        appearance,
        status: saving ? 'saving' : errorKey ?? 'ready',
      })}
    </Text>
  );
}

function probeState() {
  return JSON.parse(app?.root.findByProps({ testID: 'probe' }).props.children);
}

test('withholds main UI until settings read succeeds and restores language/theme before the first main render', async () => {
  const services = await testPersistence(db);
  await services.preferences.update({
    language: 'uk',
    themeMode: 'dark',
    defaultPlatform: 'bolt',
    hapticsEnabled: true,
  });
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const initialize = async () => {
    await gate;
    return services;
  };
  await act(async () => {
    app = ReactTestRenderer.create(
      <PersistenceProvider initialize={initialize}>
        <LanguageProvider>
          <ThemeProvider>
            <Probe />
          </ThemeProvider>
        </LanguageProvider>
      </PersistenceProvider>,
    );
  });
  expect(app?.root.findAllByProps({ testID: 'probe' })).toHaveLength(0);
  await act(async () => release?.());
  expect(probeState()).toMatchObject({
    language: 'uk',
    mode: 'dark',
    appearance: 'dark',
    preferences: { defaultPlatform: 'bolt', hapticsEnabled: true },
  });
});

test('bootstrap failure displays retry and does not show guessed settings', async () => {
  const services = await testPersistence(db);
  let fail = true;
  const initialize = async () => {
    if (fail) {
      throw new Error('Unavailable');
    }
    return services;
  };
  await act(async () => {
    app = ReactTestRenderer.create(
      <PersistenceProvider initialize={initialize}>
        <Text testID="main">Main</Text>
      </PersistenceProvider>,
    );
  });
  expect(app?.root.findAllByProps({ testID: 'main' })).toHaveLength(0);
  expect(JSON.stringify(app?.toJSON())).toContain('No se pueden abrir');
  fail = false;
  const retry = app?.root.findAll(
    node => typeof node.props.onPress === 'function',
  )[0];
  await act(async () => retry?.props.onPress());
  expect(JSON.stringify(app?.toJSON())).toContain('Main');
});

test('failed preference write retains committed language/theme, shows error and allows retry', async () => {
  let fail = false;
  const connection: SqlConnection = {
    ...db,
    transaction: work =>
      db.transaction(async tx => {
        await work(tx);
        if (fail) {
          throw new Error('Disk full');
        }
      }),
  };
  const services = await testPersistence(connection);
  await services.preferences.update({ language: 'uk', themeMode: 'dark' });
  const initialize = async () => services;
  await act(async () => {
    app = ReactTestRenderer.create(
      <PersistenceProvider initialize={initialize}>
        <LanguageProvider>
          <ThemeProvider>
            <Probe />
          </ThemeProvider>
        </LanguageProvider>
      </PersistenceProvider>,
    );
  });
  fail = true;
  await act(async () =>
    app?.root.findByProps({ testID: 'probe' }).props.onPress(),
  );
  expect(probeState()).toMatchObject({
    language: 'uk',
    mode: 'dark',
    status: 'themeWriteFailed',
  });
  expect(await services.preferences.read()).toMatchObject({
    language: 'uk',
    themeMode: 'dark',
  });
  fail = false;
  await act(async () =>
    app?.root.findByProps({ testID: 'probe' }).props.onPress(),
  );
  expect(probeState()).toMatchObject({
    language: 'en',
    mode: 'light',
    status: 'ready',
  });
});

test('data-change hook subscribes only for its mounted lifetime', async () => {
  const services = await testPersistence(db);
  const changed = jest.fn();
  function Subscriber() {
    useDataChanges(changed);
    return null;
  }
  const initialize = async () => services;
  await act(async () => {
    app = ReactTestRenderer.create(
      <PersistenceProvider initialize={initialize}>
        <Subscriber />
      </PersistenceProvider>,
    );
  });
  await act(async () => {
    await services.transactions.save(
      services.transactions.newPendingOperation(),
      validInput,
    );
  });
  expect(changed).toHaveBeenCalledWith('transactions');
  await act(async () => app?.unmount());
  app = undefined;
  await services.preferences.update({ language: 'en' });
  expect(changed).toHaveBeenCalledTimes(1);
});
