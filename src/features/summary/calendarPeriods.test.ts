import {
  getCalendarDayBounds,
  getCalendarMonthBounds,
  getCalendarMonthDays,
} from './periods';

test('selected coordinates resolve in the device zone, not as a UTC date string', () => {
  const bounds = getCalendarDayBounds(
    { year: 2026, month: 10, day: 9 },
    'Europe/Madrid',
  );
  expect(bounds.start.toISOString()).toBe('2026-10-08T22:00:00.000Z');
  expect(bounds.end.toISOString()).toBe('2026-10-09T22:00:00.000Z');
});

test.each([
  [3, 29, 23],
  [10, 25, 25],
])('DST date %s/%s has %s hours', (month, day, hours) => {
  const bounds = getCalendarDayBounds(
    { year: 2026, month, day },
    'Europe/Madrid',
  );
  expect(bounds.end.getTime() - bounds.start.getTime()).toBe(hours * 3600000);
});

test('month boundaries span leap February and December rollover', () => {
  const february = getCalendarMonthDays(
    { year: 2024, month: 2 },
    'Europe/Madrid',
  );
  expect(february).toHaveLength(29);
  expect(february[28].dateKey).toBe('2024-02-29');
  const bounds = getCalendarMonthBounds(
    { year: 2026, month: 12 },
    'Europe/Madrid',
  );
  expect(bounds.start.toISOString()).toBe('2026-11-30T23:00:00.000Z');
  expect(bounds.end.toISOString()).toBe('2026-12-31T23:00:00.000Z');
  february.slice(1).forEach((day, index) => {
    expect(day.start.getTime()).toBe(february[index].end.getTime());
  });
});

test('midnight gap moves forward and repeated midnight selects earliest occurrence', () => {
  expect(
    getCalendarDayBounds(
      { year: 2018, month: 11, day: 4 },
      'America/Sao_Paulo',
    ).start.toISOString(),
  ).toBe('2018-11-04T03:00:00.000Z');
  expect(
    getCalendarDayBounds(
      { year: 2026, month: 11, day: 1 },
      'America/Havana',
    ).start.toISOString(),
  ).toBe('2026-11-01T04:00:00.000Z');
});

test('skipped local date is empty and does not borrow the following day', () => {
  const days = getCalendarMonthDays({ year: 2011, month: 12 }, 'Pacific/Apia');
  const skipped = days[29];
  expect(skipped.dateKey).toBe('2011-12-30');
  expect(skipped.start.toISOString()).toBe('2011-12-30T10:00:00.000Z');
  expect(skipped.end.getTime()).toBe(skipped.start.getTime());
  expect(days[30].start.getTime()).toBe(skipped.end.getTime());
});

test.each([
  { year: 2026, month: 0, day: 1 },
  { year: 2026, month: 13, day: 1 },
  { year: 2026, month: 2, day: 29 },
  { year: 1900, month: 2, day: 29 },
  { year: 2026, month: 4, day: 31 },
  { year: 2026, month: 1, day: 0 },
  { year: 2026.5, month: 1, day: 1 },
  { year: NaN, month: 1, day: 1 },
  { year: 1000000, month: 1, day: 1 },
])('invalid coordinates fail instead of rolling over: %p', value => {
  expect(() => getCalendarDayBounds(value, 'UTC')).toThrow(RangeError);
});

test('Gregorian century leap rule and years outside typical UI windows are supported', () => {
  expect(getCalendarMonthDays({ year: 2000, month: 2 }, 'UTC')).toHaveLength(
    29,
  );
  expect(
    getCalendarMonthBounds({ year: 99, month: 1 }, 'UTC').start.toISOString(),
  ).toBe('0099-01-01T00:00:00.000Z');
  expect(
    getCalendarMonthBounds(
      { year: 12000, month: 1 },
      'UTC',
    ).start.toISOString(),
  ).toBe('+012000-01-01T00:00:00.000Z');
  expect(
    getCalendarMonthBounds({ year: 0, month: 1 }, 'UTC').start.toISOString(),
  ).toBe('0000-01-01T00:00:00.000Z');
});

test('unrepresentable end boundaries and invalid zones fail visibly', () => {
  expect(() =>
    getCalendarDayBounds({ year: 275760, month: 9, day: 13 }, 'UTC'),
  ).toThrow(RangeError);
  expect(() =>
    getCalendarMonthBounds({ year: 2026, month: 1 }, 'Invalid/Zone'),
  ).toThrow(RangeError);
});
