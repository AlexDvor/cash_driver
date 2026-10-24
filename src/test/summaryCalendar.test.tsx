import React from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNavigationContainerRef } from '@react-navigation/native';
import Renderer, { act } from 'react-test-renderer';
import { AppNavigator } from '../navigation/AppNavigator';
import { RootStackParamList } from '../navigation/navigationTypes';
import {
  PersistenceProvider,
  usePersistence,
} from '../providers/PersistenceProvider/PersistenceProvider';
import { LanguageProvider } from '../providers/LanguageProvider/LanguageProvider';
import { ThemeProvider } from '../providers/ThemeProvider/ThemeProvider';
import { Persistence } from '../app/persistence';
import { SqlConnection } from '../database/sqlite';
import { CashSummary } from '../features/summary/summary';
import { CalendarDay } from '../components/CalendarModal/CalendarDay';
import { CalendarNavigation } from '../components/CalendarNavigation/CalendarNavigation';
import { SummaryScreen } from '../screens/SummaryScreen/SummaryScreen';
import { CalendarModal } from '../components/CalendarModal/CalendarModal';
import { HistoryScreen } from '../screens/HistoryScreen/HistoryScreen';
import { DELETION_UNDO_SECONDS } from '../features/transactions/deletionConstants';
import {
  openTestDatabase,
  testPersistence,
  validInput,
} from './sqliteTestDatabase';

let db: SqlConnection;
let services: Persistence;
let app: Renderer.ReactTestRenderer;
let preferences: ReturnType<typeof usePersistence>;
let zone: string;
let ref = createNavigationContainerRef<RootStackParamList>();
const originalState = AppState.currentState;
function Probe() {
  preferences = usePersistence();
  return null;
}
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-11T10:00:00Z'));
  AppState.currentState = 'active';
  zone = 'UTC';
  const options = Intl.DateTimeFormat.prototype.resolvedOptions;
  jest
    .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    .mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...options.call(this), timeZone: zone };
    });
  db = openTestDatabase();
  services = await testPersistence(db, () => new Date());
  ref = createNavigationContainerRef<RootStackParamList>();
});

test('a skipped local date displays its selected coordinates rather than a reversed UTC-derived range', async () => {
  zone = 'Pacific/Apia';
  await mount();
  await press('Mes');
  await act(async () => {
    app.root
      .findByType(SummaryScreen)
      .findByType(CalendarNavigation)
      .props.calendar.applyDay({ year: 2011, month: 12, day: 30 });
  });
  expect(text('summary-count')).toBe('Operaciones: 0');
  expect(text('summary-range')).toContain('30 de diciembre de 2011');
  expect(text('summary-range')).not.toContain('29');
  expect(text('summary-range')).not.toContain('31');
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
    app = Renderer.create(
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
  await press('Resumen');
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
function text(id: string) {
  const matches = app.root.findAllByProps({ testID: id });
  const value = matches[matches.length - 1]?.props.children;
  return Array.isArray(value) ? value.join('') : String(value);
}
function content() {
  return JSON.stringify(app.toJSON());
}
async function seed(
  date: string,
  input: Parameters<typeof services.transactions.save>[1] = validInput,
) {
  const now = new Date();
  jest.setSystemTime(new Date(date));
  const row = await services.transactions.save(
    services.transactions.newPendingOperation(),
    input,
  );
  jest.setSystemTime(now);
  return row;
}
async function historicalFebruary() {
  await press('Mes');
  await press('Abrir calendario');
  await press('Elegir mes y año');
  await press('Año anterior');
  await press('febrero');
  await press('Mostrar mes');
}
async function pressDay(day: number) {
  const node = app.root
    .findAllByProps({ testID: 'calendar-current-page' })[0]
    .findAllByType(CalendarDay)
    .find(
      candidate =>
        candidate.props.date?.day === day &&
        candidate.props.date?.month === 2 &&
        candidate.props.date?.year === 2025,
    );
  if (!node) throw Error(`Missing day ${day}`);
  const button = node.findAll(
    candidate =>
      typeof candidate.props.onPress === 'function' &&
      candidate.props.accessibilityRole === 'button',
  )[0];
  await act(async () => button.props.onPress());
}

test('historical year/month and day drive SQLite totals, draft cancel and period restoration preserve selection', async () => {
  await seed('2025-02-03T12:00:00Z', {
    ...validInput,
    fareAmountCents: 1000,
    tipCents: 500,
  });
  await seed('2025-02-04T12:00:00Z', {
    ...validInput,
    platform: 'cabify',
    fareAmountCents: 1200,
    tipCents: 0,
  });
  await seed('2025-03-03T12:00:00Z');
  await seed('2026-10-11T09:00:00Z');
  await mount();
  await historicalFebruary();
  expect(text('summary-count')).toBe('Operaciones: 2');
  expect(text('summary-range')).toContain('2025');
  expect(text('summary-fareTotal')).toContain('22,00');
  expect(text('summary-tipsTotal')).toContain('5,00');
  expect(text('summary-retained')).toContain('27,00');
  expect(text('summary-averageFare')).toContain('11,00');
  expect(text('summary-cabify')).toContain('12,00');
  await press('Abrir calendario');
  await press('Elegir mes y año');
  await press('Año siguiente');
  expect(text('summary-fareTotal')).toContain('22,00');
  await press('Cancelar');
  expect(text('summary-fareTotal')).toContain('22,00');
  await press('Abrir calendario');
  await pressDay(3);
  expect(text('summary-count')).toBe('Operaciones: 1');
  expect(text('summary-range')).toContain('3 feb 2025');
  expect(text('summary-fareTotal')).toContain('10,00');
  await press('Hoy');
  expect(text('summary-fareTotal')).toContain('18,00');
  await press('Mes');
  expect(text('summary-range')).toContain('3 feb 2025');
  await press('Semana');
  expect(text('summary-range')).toContain('2026');
  await press('Mes');
  expect(text('summary-range')).toContain('3 feb 2025');
  await press('Abrir calendario');
  await press('Elegir mes y año');
  await press('Año siguiente');
  await press('Inicio');
  expect(content()).not.toContain('Mostrar mes');
  await press('Resumen');
  expect(text('summary-fareTotal')).toContain('10,00');
  expect(content()).not.toContain('Mostrar mes');
  await act(async () => {
    await preferences.updatePreferences({ language: 'en', themeMode: 'dark' });
  });
  expect(text('summary-range')).toContain('2025');
  expect(text('summary-fareTotal')).toContain('10.00');
  await press('Return to month');
  expect(text('summary-count')).toBe('Operations: 2');
  expect(text('summary-fareTotal')).toContain('22.00');
  await press('History');
  const historyMonth = app.root
    .findByType(HistoryScreen)
    .findAll(
      node =>
        node.props.accessibilityLabel === 'Month' &&
        typeof node.props.onPress === 'function',
    );
  await act(async () => {
    historyMonth[historyMonth.length - 1].props.onPress();
  });
  const historyCalendar = app.root
    .findByType(HistoryScreen)
    .findByType(CalendarNavigation);
  expect(historyCalendar.props.calendar.month).toEqual({
    year: 2026,
    month: 10,
  });
});

test('switching calendar month hides old values while loading; errors never fabricate zero totals and retry shows genuine empty', async () => {
  await seed('2025-02-03T12:00:00Z');
  await mount();
  await historicalFebruary();
  let reject: (error: Error) => void = () => {};
  const pending = new Promise<CashSummary>((_, fail) => {
    reject = fail;
  });
  jest
    .spyOn(services.transactions, 'summarize')
    .mockImplementationOnce(() => pending);
  await press('Mes siguiente');
  expect(content()).toContain('Cargando resumen');
  expect(text('summary-fareTotal')).toBe('undefined');
  expect(text('summary-count')).toBe('undefined');
  expect(content()).not.toContain('No hay operaciones en este período');
  await act(async () => reject(Error('test read failure')));
  expect(content()).toContain('No se pudo cargar el resumen');
  expect(text('summary-count')).toBe('undefined');
  await press('Reintentar');
  expect(text('summary-count')).toBe('Operaciones: 0');
  expect(text('summary-retained')).toContain('0,00');
  expect(content()).toContain('No hay operaciones en este período');
});

test('same-period refresh identifies retained values during loading and error, then retry reads committed edit without changing historical date', async () => {
  const row = await seed('2025-02-03T12:00:00Z');
  await mount();
  await historicalFebruary();
  let reject: (error: Error) => void = () => {};
  const pending = new Promise<CashSummary>((_, fail) => {
    reject = fail;
  });
  const summarize = jest
    .spyOn(services.transactions, 'summarize')
    .mockImplementationOnce(() => pending);
  await act(async () => {
    await services.transactions.edit(row.id, {
      ...validInput,
      fareAmountCents: 1500,
      tipCents: 400,
    });
  });
  expect(content()).toContain('Actualizando');
  expect(text('summary-fareTotal')).toContain('18,00');
  await act(async () => reject(Error('test refresh failure')));
  expect(content()).toContain('Datos anteriores; actualización fallida');
  expect(text('summary-retained')).toContain('20,00');
  await press('Reintentar');
  expect(text('summary-fareTotal')).toContain('15,00');
  expect(text('summary-tipsTotal')).toContain('4,00');
  expect(text('summary-range')).toContain('2025');
  expect(summarize.mock.calls[summarize.mock.calls.length - 1][0]).toEqual({
    start: new Date('2025-02-01T00:00:00Z'),
    end: new Date('2025-03-01T00:00:00Z'),
  });
  expect((await services.transactions.get(row.id))?.createdAt).toBe(
    row.createdAt,
  );
});

test('historical selection preserves pending deletion/undo and background cancellation; only committed expiry clears totals', async () => {
  const listeners = new Set<(state: AppStateStatus) => void>();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
    listeners.add(callback);
    return {
      remove: () => {
        listeners.delete(callback);
      },
    };
  });
  const row = await seed('2025-02-03T12:00:00Z');
  await mount();
  await historicalFebruary();
  const alert = jest.spyOn(Alert, 'alert');
  async function begin() {
    await act(async () => ref.navigate('Details', { id: row.id }));
    await press('Eliminar');
    await act(async () =>
      alert.mock.calls[alert.mock.calls.length - 1][2]
        ?.find(action => action.style === 'destructive')
        ?.onPress?.(),
    );
    await act(async () => ref.goBack());
  }
  await begin();
  expect(text('summary-count')).toBe('Operaciones: 1');
  await press('Deshacer');
  expect(await services.transactions.get(row.id)).toEqual(row);
  await begin();
  await act(async () => {
    AppState.currentState = 'background';
    listeners.forEach(callback => callback('background'));
  });
  await act(async () => jest.advanceTimersByTime(DELETION_UNDO_SECONDS * 1000));
  expect(await services.transactions.get(row.id)).toEqual(row);
  await act(async () => {
    AppState.currentState = 'active';
    listeners.forEach(callback => callback('active'));
  });
  expect(text('summary-count')).toBe('Operaciones: 1');
  expect(text('summary-range')).toContain('2025');
  await begin();
  await act(async () => jest.advanceTimersByTime(DELETION_UNDO_SECONDS * 1000));
  expect(text('summary-count')).toBe('Operaciones: 0');
  expect(text('summary-range')).toContain('2025');
});

function dayLabel(day: number, month: number, year: number) {
  const grid = app.root
    .findByType(SummaryScreen)
    .findByType(CalendarNavigation);
  const cell = grid
    .findAllByProps({ testID: 'calendar-current-page' })[0]
    .findAllByType(CalendarDay)
    .find(
      node =>
        node.props.date?.day === day &&
        node.props.date?.month === month &&
        node.props.date?.year === year,
    );
  if (!cell) throw Error('Missing calendar day');
  return cell.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function',
  )[0].props.accessibilityLabel as string;
}

test('Mes shows only the shared month panel; calendar activity starts on click and stops on dismissal', async () => {
  await seed('2026-10-11T09:00:00Z');
  const occupied = jest.spyOn(services.transactions, 'occupiedDates');
  await mount();
  await press('Mes');
  expect(app.root.findByType(CalendarModal).props.draftMonth).toBeNull();
  expect(occupied).not.toHaveBeenCalled();
  expect(
    app.root.findByType(SummaryScreen).findByType(CalendarNavigation).props
      .calendar.draftMonth,
  ).toBeNull();
  expect(app.root.findAllByType(CalendarDay)).toHaveLength(0);
  await press('Abrir calendario');
  expect(occupied).toHaveBeenCalledTimes(1);
  expect(dayLabel(11, 10, 2026)).toContain('Con operaciones');
  await press('Mes anterior');
  expect(occupied).toHaveBeenCalledTimes(2);
  expect(text('summary-range')).toContain('oct');
  await press('Cancelar');
  expect(app.root.findAllByType(CalendarDay)).toHaveLength(0);
  expect(text('summary-range')).toContain('oct');
  await press('Mes siguiente');
  expect(occupied).toHaveBeenCalledTimes(2);
  expect(text('summary-range')).toContain('nov');
  await press('Abrir calendario');
  expect(occupied).toHaveBeenCalledTimes(3);
  await press('Inicio');
  await press('Resumen');
  expect(
    app.root.findByType(SummaryScreen).findByType(CalendarNavigation).props
      .calendar.draftMonth,
  ).toBeNull();
  expect(app.root.findAllByType(CalendarDay)).toHaveLength(0);
});

test('modal markers reject old-month responses and retry unknown/error activity without changing the applied month', async () => {
  let resolveOld: (dates: string[]) => void = () => {};
  const occupied = jest
    .spyOn(services.transactions, 'occupiedDates')
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOld = resolve;
        }),
    );
  await mount();
  await press('Mes');
  await press('Abrir calendario');
  expect(dayLabel(11, 10, 2026)).toContain('Actividad sin confirmar');
  await press('Mes siguiente');
  expect(dayLabel(11, 11, 2026)).toContain('Sin operaciones');
  await act(async () => resolveOld(['2026-10-11']));
  expect(dayLabel(11, 11, 2026)).toContain('Sin operaciones');
  occupied.mockRejectedValueOnce(Error('activity failure'));
  await press('Mes siguiente');
  expect(
    app.root.findAll(node => node.props.testID === 'calendar-activity-retry')[0]
      .props.accessibilityLabel,
  ).toContain('No se pudieron cargar los días con operaciones');
  expect(dayLabel(11, 12, 2026)).toContain('Actividad sin confirmar');
  expect(text('summary-range')).toContain('oct');
  await act(async () =>
    app.root
      .findAll(
        node =>
          node.props.testID === 'calendar-activity-retry' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress(),
  );
  expect(dayLabel(11, 12, 2026)).toContain('Sin operaciones');
  await press('Mostrar mes');
  expect(text('summary-range')).toContain('dic');
});
