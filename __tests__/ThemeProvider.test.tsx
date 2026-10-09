import React from 'react';
import {
  Appearance,
  AppState,
  NativeModules,
  Platform,
  Text,
} from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider, useAppTheme } from '../src/theme/ThemeProvider';
import { ChoiceGroup } from '../src/components/ChoiceGroup';
import { ThemeMode } from '../src/theme/resolveTheme';
import { PersistenceProvider } from '../src/app/PersistenceProvider';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

// Exercise the real subscription hook instead of the preset's fixed light mock.
jest.unmock('react-native/Libraries/Utilities/useColorScheme');

function ThemeProbe() {
  const { appearance, mode, setMode } = useAppTheme();
  const options: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'system' },
    { value: 'light', label: 'light' },
    { value: 'dark', label: 'dark' },
  ];
  return (
    <>
      <Text testID="appearance">{appearance}</Text>
      <ChoiceGroup
        label="theme"
        options={options}
        value={mode}
        onChange={setMode}
      />
    </>
  );
}

test('reacts to system changes, keeps explicit override, and unsubscribes on unmount', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const setBars = jest.fn();
  NativeModules.CashDriverSystemBars = { setAppearance: setBars };
  let resume = () => {};
  const removeResume = jest.fn();
  const subscribeResume = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      resume = () => listener('active');
      return { remove: removeResume };
    });
  let systemAppearance: 'light' | 'dark' = 'light';
  let notify = () => {};
  const remove = jest.fn();
  const getScheme = jest
    .spyOn(Appearance, 'getColorScheme')
    .mockImplementation(() => systemAppearance);
  const subscribe = jest
    .spyOn(Appearance, 'addChangeListener')
    .mockImplementation(listener => {
      notify = () => listener({ colorScheme: systemAppearance });
      return { remove };
    });
  let app: ReactTestRenderer.ReactTestRenderer | undefined;
  let subscriptionCount = 0;
  const db = openTestDatabase();
  const services = await testPersistence(db);
  const initialize = async () => services;
  try {
    await act(async () => {
      app = ReactTestRenderer.create(
        <PersistenceProvider initialize={initialize}>
          <ThemeProvider>
            <ThemeProbe />
          </ThemeProvider>
        </PersistenceProvider>,
      );
    });
    if (!app) {
      throw new Error('Theme provider did not mount');
    }
    const root = app.root;
    expect(root.findByProps({ testID: 'appearance' }).props.children).toBe(
      'light',
    );
    expect(setBars).toHaveBeenLastCalledWith(false, '#FFFFFF');
    await act(async () => {
      systemAppearance = 'dark';
      notify();
    });
    expect(root.findByProps({ testID: 'appearance' }).props.children).toBe(
      'dark',
    );
    expect(setBars).toHaveBeenLastCalledWith(true, '#1A2520');
    const light = root
      .findAll(node => typeof node.props.onPress === 'function')
      .find(
        node =>
          node.props.accessibilityRole === 'radio' &&
          node.props.accessibilityLabel === 'light',
      );
    expect(light).toBeDefined();
    await act(async () => light?.props.onPress());
    expect(root.findByProps({ testID: 'appearance' }).props.children).toBe(
      'light',
    );
    setBars.mockClear();
    await act(async () => resume());
    expect(setBars).toHaveBeenCalledWith(false, '#FFFFFF');
    await act(async () => {
      systemAppearance = 'light';
      notify();
    });
    await act(async () => {
      systemAppearance = 'dark';
      notify();
    });
    expect(root.findByProps({ testID: 'appearance' }).props.children).toBe(
      'light',
    );
  } finally {
    subscriptionCount = subscribe.mock.calls.length;
    await act(async () => app?.unmount());
    getScheme.mockRestore();
    subscribe.mockRestore();
    expect(removeResume).toHaveBeenCalledTimes(
      subscribeResume.mock.calls.length,
    );
    subscribeResume.mockRestore();
    delete NativeModules.CashDriverSystemBars;
    jest.restoreAllMocks();
    db.close();
  }
  expect(subscriptionCount).toBeGreaterThan(0);
  expect(remove).toHaveBeenCalledTimes(subscriptionCount);
});
