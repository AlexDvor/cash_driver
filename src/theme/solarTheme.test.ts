import { getTimes } from 'suncalc';
import { calculateSolarTheme } from './solarTheme';

const kyiv = { latitude: 50.45, longitude: 30.52 };
const at = (date: string, location = kyiv) =>
  calculateSolarTheme(Date.parse(date), location);

test('matches the published SunCalc Kyiv 24 August 2026 sunrise/sunset example', () => {
  // README example: sunrise ~05:59 EEST, sunset ~19:59 EEST.
  expect(at('2026-08-24T02:50:00Z')?.appearance).toBe('dark');
  expect(at('2026-08-24T03:10:00Z')?.appearance).toBe('light');
  expect(at('2026-08-24T16:50:00Z')?.appearance).toBe('light');
  expect(at('2026-08-24T17:10:00Z')?.appearance).toBe('dark');
});

test('switches at the sunrise and sunset instants, with the next future boundary', () => {
  const { sunrise, sunset } = getTimes(
    new Date('2026-08-24T12:00:00Z'),
    kyiv.latitude,
    kyiv.longitude,
  );
  expect(calculateSolarTheme(sunrise!.getTime() - 1, kyiv)?.appearance).toBe(
    'dark',
  );
  expect(calculateSolarTheme(sunrise!.getTime(), kyiv)).toEqual({
    appearance: 'light',
    nextChangeAt: sunset!.getTime(),
  });
  expect(calculateSolarTheme(sunset!.getTime(), kyiv)?.appearance).toBe('dark');
  expect(
    calculateSolarTheme(sunset!.getTime(), kyiv)!.nextChangeAt,
  ).toBeGreaterThan(sunset!.getTime());
});

test('seasons change the result at the same clock time in opposite hemispheres', () => {
  expect(at('2026-06-21T04:00:00Z')?.appearance).toBe('light');
  expect(at('2026-12-21T04:00:00Z')?.appearance).toBe('dark');
  const sydney = { latitude: -33.87, longitude: 151.21 };
  expect(at('2026-06-21T20:00:00Z', sydney)?.appearance).toBe('dark');
  expect(at('2026-12-21T20:00:00Z', sydney)?.appearance).toBe('light');
});

test.each([-179.9, 179.9])(
  'handles the international date line at longitude %s',
  longitude => {
    const location = { latitude: 0, longitude };
    expect(at('2026-03-20T23:00:00Z', location)?.appearance).toBe('light');
    expect(at('2026-03-20T11:00:00Z', location)?.appearance).toBe('dark');
  },
);

test('handles polar day/night without invalid timers', () => {
  expect(at('2026-06-21T12:00:00Z', { latitude: 89, longitude: 0 })).toEqual({
    appearance: 'light',
    nextChangeAt: null,
  });
  expect(at('2026-12-21T12:00:00Z', { latitude: 89, longitude: 0 })).toEqual({
    appearance: 'dark',
    nextChangeAt: null,
  });
});

test('rejects invalid coordinates and time instead of guessing a theme', () => {
  expect(calculateSolarTheme(NaN, kyiv)).toBeNull();
  expect(at('2026-01-01T00:00Z', { latitude: 91, longitude: 0 })).toBeNull();
  expect(
    at('2026-01-01T00:00Z', { latitude: 0, longitude: Infinity }),
  ).toBeNull();
});
