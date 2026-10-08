import {
  getPeriodBounds,
  isWithinPeriod,
  SummaryPeriod,
} from '../src/features/summary/periods';

const timeZone = 'Europe/Madrid';
function expectBounds(
  reference: string,
  period: SummaryPeriod,
  start: string,
  end: string,
  zone = timeZone,
) {
  const date = new Date(reference);
  const before = date.toISOString();
  const bounds = getPeriodBounds(date, period, zone);
  expect(bounds.start.toISOString()).toBe(start);
  expect(bounds.end.toISOString()).toBe(end);
  expect(date.toISOString()).toBe(before);
  expect(isWithinPeriod(date, bounds)).toBe(true);
  return bounds;
}

test('local day uses the passed zone rather than the host zone or UTC date', () => {
  expectBounds(
    '2026-10-08T22:30:00.000Z',
    'day',
    '2026-10-08T22:00:00.000Z',
    '2026-10-09T22:00:00.000Z',
  );
  expectBounds(
    '2026-10-08T22:30:00.000Z',
    'day',
    '2026-10-08T00:00:00.000Z',
    '2026-10-09T00:00:00.000Z',
    'UTC',
  );
  expectBounds(
    '2026-10-08T02:30:00.000Z',
    'day',
    '2026-10-07T04:00:00.000Z',
    '2026-10-08T04:00:00.000Z',
    'America/New_York',
  );
});

test.each(['2026-01-05T00:00:00.000Z', '2026-01-11T12:00:00.000Z'])(
  'week starts Monday for %s including Sunday',
  reference => {
    expectBounds(
      reference,
      'week',
      '2026-01-04T23:00:00.000Z',
      '2026-01-11T23:00:00.000Z',
    );
  },
);

test('weeks and months cross the year using calendar construction', () => {
  expectBounds(
    '2026-01-01T12:00:00.000Z',
    'week',
    '2025-12-28T23:00:00.000Z',
    '2026-01-04T23:00:00.000Z',
  );
  expectBounds(
    '2026-12-31T12:00:00.000Z',
    'month',
    '2026-11-30T23:00:00.000Z',
    '2026-12-31T23:00:00.000Z',
  );
  expectBounds(
    '2024-02-29T12:00:00.000Z',
    'month',
    '2024-01-31T23:00:00.000Z',
    '2024-02-29T23:00:00.000Z',
  );
});

test('spring DST day has 23 hours and fall DST day has 25 hours', () => {
  const spring = expectBounds(
    '2026-03-29T12:00:00.000Z',
    'day',
    '2026-03-28T23:00:00.000Z',
    '2026-03-29T22:00:00.000Z',
  );
  const fall = expectBounds(
    '2026-10-25T12:00:00.000Z',
    'day',
    '2026-10-24T22:00:00.000Z',
    '2026-10-25T23:00:00.000Z',
  );
  expect(spring.end.getTime() - spring.start.getTime()).toBe(
    23 * 60 * 60 * 1000,
  );
  expect(fall.end.getTime() - fall.start.getTime()).toBe(25 * 60 * 60 * 1000);
});

test('DST week/month ends have the new offset rather than adding fixed days', () => {
  expectBounds(
    '2026-03-29T12:00:00.000Z',
    'week',
    '2026-03-22T23:00:00.000Z',
    '2026-03-29T22:00:00.000Z',
  );
  expectBounds(
    '2026-03-29T12:00:00.000Z',
    'month',
    '2026-02-28T23:00:00.000Z',
    '2026-03-31T22:00:00.000Z',
  );
});

test('midnight DST gap follows calendar construction, not a fabricated midnight', () => {
  expectBounds(
    '2018-11-04T12:00:00.000Z',
    'day',
    '2018-11-04T03:00:00.000Z',
    '2018-11-05T02:00:00.000Z',
    'America/Sao_Paulo',
  );
});

test('repeated local midnight uses the earliest occurrence', () => {
  const bounds = expectBounds(
    '2026-11-01T12:00:00.000Z',
    'day',
    '2026-11-01T04:00:00.000Z',
    '2026-11-02T05:00:00.000Z',
    'America/Havana',
  );
  expect(isWithinPeriod(new Date('2026-11-01T05:00:00.000Z'), bounds)).toBe(
    true,
  );
});

test('period membership is start inclusive and end exclusive to millisecond precision', () => {
  const bounds = getPeriodBounds(
    new Date('2026-10-08T12:00:00.000Z'),
    'day',
    timeZone,
  );
  expect(isWithinPeriod(bounds.start, bounds)).toBe(true);
  expect(isWithinPeriod(new Date(bounds.start.getTime() - 1), bounds)).toBe(
    false,
  );
  expect(isWithinPeriod(new Date(bounds.end.getTime() - 1), bounds)).toBe(true);
  expect(isWithinPeriod(bounds.end, bounds)).toBe(false);
});

test('invalid dates, zones, or reversed bounds fail visibly', () => {
  expect(() => getPeriodBounds(new Date(NaN), 'day', timeZone)).toThrow(
    RangeError,
  );
  expect(() =>
    getPeriodBounds(
      new Date('2026-10-08T12:00:00.000Z'),
      'day',
      'Invalid/Zone',
    ),
  ).toThrow(RangeError);
  const start = new Date('2026-10-08T12:00:00.000Z');
  expect(() => isWithinPeriod(start, { start, end: start })).toThrow(
    RangeError,
  );
  expect(() =>
    isWithinPeriod(new Date(NaN), {
      start,
      end: new Date('2026-10-09T12:00:00.000Z'),
    }),
  ).toThrow(RangeError);
});
