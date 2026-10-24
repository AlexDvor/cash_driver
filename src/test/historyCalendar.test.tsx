import React from 'react';
import { AppState, SectionList } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import Renderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../navigation/AppNavigator';
import { RootStackParamList } from '../navigation/navigationTypes';
import { PersistenceProvider } from '../providers/PersistenceProvider/PersistenceProvider';
import { LanguageProvider } from '../providers/LanguageProvider/LanguageProvider';
import { ThemeProvider } from '../providers/ThemeProvider/ThemeProvider';
import { Persistence } from '../app/persistence';
import { SqlConnection } from '../database/sqlite';
import { HistoryScreen } from '../screens/HistoryScreen/HistoryScreen';
import { CalendarDay } from '../components/CalendarModal/CalendarDay';
import { CalendarNavigation } from '../components/CalendarNavigation/CalendarNavigation';
import { SummaryScreen } from '../screens/SummaryScreen/SummaryScreen';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';

let db: SqlConnection;
let services: Persistence;
let app: Renderer.ReactTestRenderer;
const originalState = AppState.currentState;
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-11T10:00:00Z'));
  AppState.currentState = 'active';
  const options = Intl.DateTimeFormat.prototype.resolvedOptions;
  jest
    .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    .mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...options.call(this), timeZone: 'UTC' };
    });
  db = openTestDatabase();
  services = await testPersistence(db, () => new Date());
});
afterEach(async () => {
  await act(async () => app?.unmount());
  db.close();
  AppState.currentState = originalState;
  jest.restoreAllMocks();
  jest.useRealTimers();
});
async function mount() {
  const ref = createNavigationContainerRef<RootStackParamList>();
  await act(async () => {
    app = Renderer.create(
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
  await press('Historial');
}
function history() {
  return app.root.findByType(HistoryScreen);
}
async function press(label: string) {
  const matches = app.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityLabel === label,
  );
  if (!matches.length) throw Error(`Missing ${label}`);
  await act(async () => {
    await matches[matches.length - 1].props.onPress();
  });
}
async function seed(date: string, platform: 'uber' | 'cabify' = 'uber') {
  const now = new Date();
  jest.setSystemTime(new Date(date));
  const row = await services.transactions.save(
    services.transactions.newPendingOperation(),
    { ...validInput, platform },
  );
  jest.setSystemTime(now);
  return row;
}
function rows() {
  return history()
    .findByType(SectionList)
    .props.sections.flatMap((section: { data: { id: string }[] }) =>
      section.data.map(row => row.id),
    );
}
function historyContent() {
  return history()
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children)
    .join(' ');
}
async function historicalFebruary() {
  await press('Mes');
  await press('Abrir calendario');
  await press('Elegir mes y año');
  await press('Año anterior');
  await press('febrero');
  await press('Mostrar mes');
}
test('past-year month/day queries preserve platform, all-platform markers and independent remembered selection', async () => {
  const uber = await seed('2025-02-03T12:00:00Z');
  const cabify = await seed('2025-02-04T12:00:00Z', 'cabify');
  await seed('2025-03-03T12:00:00Z');
  const today = await seed('2026-10-11T09:00:00Z');
  const read = jest.spyOn(services.transactions, 'listPage');
  await mount();
  expect(rows()).toEqual([today.id]);
  await historicalFebruary();
  expect(rows()).toEqual([cabify.id, uber.id]);
  await press('Uber');
  expect(rows()).toEqual([uber.id]);
  await press('Abrir calendario');
  const day = history()
    .findAllByProps({ testID: 'calendar-current-page' })[0]
    .findAllByType(CalendarDay)
    .find(node => node.props.date?.day === 4)!;
  const dayButtons = day.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityRole === 'button',
  );
  const dayButton = dayButtons[dayButtons.length - 1];
  expect(dayButton.props.accessibilityLabel).toContain('todas las plataformas');
  await act(async () => dayButton.props.onPress());
  expect(rows()).toEqual([]);
  expect(historyContent()).toContain('No hay operaciones con estos filtros');
  expect(historyContent()).not.toContain('Registrar cobro');
  await press('Volver al mes');
  expect(rows()).toEqual([uber.id]);
  await press('Hoy');
  expect(rows()).toEqual([today.id]);
  await press('Mes');
  expect(rows()).toEqual([uber.id]);
  const month = history().findByType(CalendarNavigation).props.calendar.month;
  await press('Abrir calendario');
  await press('Mes siguiente');
  await press('Resumen');
  await press('Mes');
  expect(
    app.root
      .findByType(SummaryScreen)
      .findAllByType(CalendarNavigation)
      .some(node => node.props.calendar.month.year === 2026),
  ).toBe(true);
  await press('Historial');
  expect(history().findByType(CalendarNavigation).props.calendar.month).toEqual(
    month,
  );
  expect(
    history().findByType(CalendarNavigation).props.calendar.draftMonth,
  ).toBeNull();
  expect(
    read.mock.calls.some(
      ([query]) =>
        query?.platform === 'uber' &&
        query?.bounds?.start.toISOString() === '2025-02-04T00:00:00.000Z',
    ),
  ).toBe(true);
});
test('paged history merges same-date groups and footer retry preserves loaded rows', async () => {
  for (let index = 0; index < 53; index += 1) {
    await seed('2026-10-11T09:00:00Z');
  }
  const read = jest.spyOn(services.transactions, 'listPage');
  await mount();
  const list = () => history().findByType(SectionList);
  const first = rows();
  expect(first).toHaveLength(50);
  expect(list().props.sections).toHaveLength(1);
  read.mockRejectedValueOnce(Error('read failed'));
  await press('Cargar más operaciones');
  expect(rows()).toEqual(first);
  await press('Reintentar');
  expect(rows()).toHaveLength(53);
  expect(new Set(rows()).size).toBe(53);
  expect(list().props.sections).toHaveLength(1);
  expect(rows().slice(0, 50)).toEqual(first);
});
test('failed global existence never displays first-record CTA and successful retry confirms empty', async () => {
  jest
    .spyOn(services.transactions, 'hasAny')
    .mockRejectedValueOnce(Error('unavailable'));
  await mount();
  expect(rows()).toEqual([]);
  expect(historyContent()).not.toContain('Registrar cobro');
  await press('Reintentar');
  expect(historyContent()).toContain('Registrar cobro');
});

test('committed removal updates historical rows and open activity markers while failed write preserves both', async () => {
  const row = await seed('2025-02-04T12:00:00Z');
  await mount();
  await historicalFebruary();
  await press('Abrir calendario');
  function marked() {
    const day = history()
      .findAllByProps({ testID: 'calendar-current-page' })[0]
      .findAllByType(CalendarDay)
      .find(node => node.props.date?.day === 4)!;
    return day
      .findAll(node => node.props.accessibilityRole === 'button')
      .some(node =>
        node.props.accessibilityLabel?.includes('todas las plataformas'),
      );
  }
  expect(marked()).toBe(true);
  const write = jest
    .spyOn(db, 'transaction')
    .mockRejectedValueOnce(Error('write failed'));
  await act(async () => {
    await expect(services.transactions.remove(row.id)).rejects.toThrow(
      'write failed',
    );
  });
  expect(rows()).toEqual([row.id]);
  expect(marked()).toBe(true);
  write.mockRestore();
  await act(async () => {
    await services.transactions.remove(row.id);
  });
  expect(rows()).toEqual([]);
  expect(marked()).toBe(false);
  expect(
    history().findByType(CalendarNavigation).props.calendar.draftMonth,
  ).toEqual({ year: 2025, month: 2 });
});

test('clock second ticks do not issue page reads or replace memoized section presentation', async () => {
  await seed('2026-10-11T09:00:00Z');
  const read = jest.spyOn(services.transactions, 'listPage');
  await mount();
  const sections = history().findByType(SectionList).props.sections;
  const calls = read.mock.calls.length;
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(read).toHaveBeenCalledTimes(calls);
  expect(history().findByType(SectionList).props.sections).toBe(sections);
});
