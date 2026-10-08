import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from '../App';
import { AppNavigator } from '../src/app/AppNavigator';
import { RootStackParamList } from '../src/app/navigationTypes';
import { LanguageProvider } from '../src/i18n/LanguageProvider';
import { ThemeProvider } from '../src/theme/ThemeProvider';

let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
    jest.runOnlyPendingTimers();
  });
  renderer = undefined;
  jest.useRealTimers();
});

async function mount(element: React.ReactElement) {
  await act(async () => {
    renderer = ReactTestRenderer.create(element);
  });
  await act(async () => jest.runOnlyPendingTimers());
  if (!renderer) {
    throw new Error('App did not mount');
  }
  return renderer;
}

async function press(
  app: ReactTestRenderer.ReactTestRenderer,
  role: string,
  label: string,
) {
  const button = app.root
    .findAll(node => typeof node.props.onPress === 'function')
    .find(
      node =>
        node.props.accessibilityRole === role &&
        node.props.accessibilityLabel === label,
    );
  if (!button) {
    throw new Error(`Missing ${role}: ${label}`);
  }
  await act(async () => button.props.onPress());
  await act(async () => jest.runOnlyPendingTimers());
}

function foundation(
  ref: ReturnType<typeof createNavigationContainerRef<RootStackParamList>>,
) {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppNavigator navigationRef={ref} />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

test('boots in Spanish with four accessible tabs and an explicit unfinished screen', async () => {
  const app = await mount(<App />);
  const tabs = app.root
    .findAll(node => typeof node.props.onPress === 'function')
    .filter(node => node.props.accessibilityRole === 'tab');
  expect(tabs.map(node => node.props.accessibilityLabel)).toEqual([
    'Inicio',
    'Historial',
    'Resumen',
    'Ajustes',
  ]);
  expect(tabs[0].props.accessibilityState.selected).toBe(true);
  expect(JSON.stringify(app.toJSON())).toContain(
    'El formulario de cobro estará disponible',
  );
});

test('tab presses change routes; details and editing return to the previous tab', async () => {
  const ref = createNavigationContainerRef<RootStackParamList>();
  const app = await mount(foundation(ref));
  for (const [label, name] of [
    ['Historial', 'History'],
    ['Resumen', 'Summary'],
    ['Ajustes', 'Settings'],
  ]) {
    await press(app, 'tab', label);
    expect(ref.getCurrentRoute()?.name).toBe(name);
  }
  await act(async () => ref.navigate('Details'));
  expect(ref.getCurrentRoute()?.name).toBe('Details');
  expect(JSON.stringify(app.toJSON())).toContain(
    'Todavía no se cargan operaciones',
  );
  await act(async () => ref.navigate('Edit'));
  expect(ref.getCurrentRoute()?.name).toBe('Edit');
  expect(JSON.stringify(app.toJSON())).toContain(
    'Todavía no se pueden modificar operaciones',
  );
  await act(async () => ref.goBack());
  expect(ref.getCurrentRoute()?.name).toBe('Details');
  await act(async () => ref.goBack());
  expect(ref.getCurrentRoute()?.name).toBe('Settings');
});

test('language and theme changes preserve navigation and localize the mounted UI', async () => {
  const ref = createNavigationContainerRef<RootStackParamList>();
  const app = await mount(foundation(ref));
  await press(app, 'tab', 'Ajustes');
  const routeKey = ref.getCurrentRoute()?.key;
  await press(app, 'radio', 'English');
  expect(ref.getCurrentRoute()?.key).toBe(routeKey);
  expect(JSON.stringify(app.toJSON())).toContain('They are not saved.');
  await press(app, 'radio', 'Dark');
  expect(ref.getCurrentRoute()?.key).toBe(routeKey);
  expect(JSON.stringify(app.toJSON())).toContain('#101714');
  await press(app, 'radio', 'Українська');
  expect(ref.getCurrentRoute()?.key).toBe(routeKey);
  expect(JSON.stringify(app.toJSON())).toContain('Налаштування');
  await press(app, 'tab', 'Головна');
  expect(ref.getCurrentRoute()?.name).toBe('Home');
  expect(JSON.stringify(app.toJSON())).toContain('Форма оплати буде доступна');
});
