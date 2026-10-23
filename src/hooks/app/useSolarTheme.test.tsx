import React from 'react';
import { AppState, Text, type AppStateStatus } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { useSolarTheme } from './useSolarTheme';
import {
  hasSolarLocationPermission,
  requestSolarLocationPermission,
  watchSolarLocation,
  type SolarLocationFix,
} from '../../features/settings/solarLocation';
import type { ThemeMode } from '../../theme/resolveTheme';
import { getTimes } from 'suncalc';

jest.mock('../../features/settings/solarLocation', () => ({
  hasSolarLocationPermission: jest.fn(),
  requestSolarLocationPermission: jest.fn(),
  watchSolarLocation: jest.fn(),
}));

let app: Renderer.ReactTestRenderer;
let result: ReturnType<typeof useSolarTheme>;
let changeState: (state: AppStateStatus) => void;
let onFix: (fix: SolarLocationFix) => void;
let onUnavailable: (permissionDenied: boolean) => void;
const stop = jest.fn();
const originalState = AppState.currentState;
function Probe({ mode }: { mode: ThemeMode }) {
  result = useSolarTheme(mode);
  return <Text>{result.status}</Text>;
}
async function mount(mode: ThemeMode = 'system') {
  await act(async () => {
    app = Renderer.create(<Probe mode={mode} />);
  });
}
async function state(value: AppStateStatus) {
  await act(async () => {
    AppState.currentState = value;
    changeState(value);
  });
}
async function fix(
  latitude = 50.45,
  longitude = 30.52,
  timestamp = Date.now(),
) {
  await act(async () => onFix({ latitude, longitude, timestamp }));
}

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
  jest.setSystemTime(new Date('2026-08-24T12:00:00Z'));
  AppState.currentState = 'active';
  jest.mocked(hasSolarLocationPermission).mockResolvedValue(true);
  jest.mocked(requestSolarLocationPermission).mockResolvedValue(true);
  jest.mocked(watchSolarLocation).mockImplementation((success, failure) => {
    onFix = success;
    onUnavailable = failure;
    return stop;
  });
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      changeState = listener;
      return { remove: jest.fn() };
    });
});
afterEach(async () => {
  await act(async () => app?.unmount());
  AppState.currentState = originalState;
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.useRealTimers();
});

test('startup never requests permission; denial leaves system fallback', async () => {
  jest.mocked(hasSolarLocationPermission).mockResolvedValue(false);
  await mount();
  expect(result.status).toBe('fallback');
  expect(result.appearance).toBeUndefined();
  expect(requestSolarLocationPermission).not.toHaveBeenCalled();
  expect(watchSolarLocation).not.toHaveBeenCalled();
});

test('recalculates at sunset without navigation and reacts to movement', async () => {
  const sunset = getTimes(new Date(), 50.45, 30.52).sunset!;
  jest.setSystemTime(sunset.getTime() - 1000);
  await mount();
  await fix();
  expect(result.appearance).toBe('light');
  await act(async () => jest.advanceTimersByTime(1001));
  expect(result.appearance).toBe('dark');
  // At the same instant a western longitude is still in daylight.
  await fix(40, -100);
  expect(result.appearance).toBe('light');
});

test('background stops observation, ignores stale fixes and resume rechecks access', async () => {
  await mount();
  await fix();
  const oldFix = onFix;
  await state('background');
  expect(stop).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
  await act(async () =>
    oldFix({ latitude: 40, longitude: -100, timestamp: Date.now() }),
  );
  expect(result.appearance).toBeUndefined();
  await state('active');
  expect(watchSolarLocation).toHaveBeenCalledTimes(2);
  expect(requestSolarLocationPermission).not.toHaveBeenCalled();
  await fix();
  expect(result.status).toBe('solar');
});

test('manual mode and unmount cancel work and reject late location callbacks', async () => {
  await mount();
  await fix();
  const late = onFix;
  await act(async () => app.update(<Probe mode="dark" />));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(result.status).toBe('idle');
  expect(jest.getTimerCount()).toBe(0);
  await act(async () =>
    late({ latitude: 40, longitude: -100, timestamp: Date.now() }),
  );
  expect(result.appearance).toBeUndefined();
  await act(async () => result.requestAccess());
  expect(requestSolarLocationPermission).not.toHaveBeenCalled();
});

test('pending permission checks cannot start observation after background', async () => {
  let resolve!: (value: boolean) => void;
  jest.mocked(hasSolarLocationPermission).mockReturnValue(
    new Promise(done => {
      resolve = done;
    }),
  );
  await mount();
  await state('background');
  await act(async () => resolve(true));
  expect(watchSolarLocation).not.toHaveBeenCalled();
});

test('no fix timeout and provider error both stop observation and use fallback', async () => {
  await mount();
  await act(async () => jest.advanceTimersByTime(19_999));
  expect(result.status).toBe('locating');
  expect(stop).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(result.status).toBe('fallback');
  expect(stop).toHaveBeenCalledTimes(1);
  await state('background');
  await state('active');
  await fix();
  await act(async () => onUnavailable(true));
  expect(result.status).toBe('fallback');
  expect(result.appearance).toBeUndefined();
});

test('a temporary provider outage can recover but permission revocation stops the watch', async () => {
  await mount();
  await act(async () => onUnavailable(false));
  expect(result.status).toBe('fallback');
  expect(stop).not.toHaveBeenCalled();
  await fix();
  expect(result.status).toBe('solar');
  await act(async () => onUnavailable(true));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(result.status).toBe('fallback');
});

test('invalid or stale fixes are not used for the theme', async () => {
  await mount();
  await fix(91, 0);
  expect(result.status).toBe('locating');
  expect(result.appearance).toBeUndefined();
  await state('background');
  await state('active');
  await fix(50, 30, Date.now() - 3600_000);
  expect(result.status).toBe('locating');
  expect(result.appearance).toBeUndefined();
  await fix();
  expect(result.status).toBe('solar');
});

test('explicit permission selection retries once and cannot restart after unmount', async () => {
  jest.mocked(hasSolarLocationPermission).mockResolvedValue(false);
  await mount();
  let resolve!: (value: boolean) => void;
  jest.mocked(requestSolarLocationPermission).mockReturnValue(
    new Promise(done => {
      resolve = done;
    }),
  );
  let pending!: Promise<void>;
  await act(async () => {
    pending = result.requestAccess();
    result.requestAccess();
  });
  expect(requestSolarLocationPermission).toHaveBeenCalledTimes(1);
  await act(async () => app.unmount());
  await act(async () => {
    resolve(true);
    await pending;
  });
  expect(watchSolarLocation).not.toHaveBeenCalled();
});
