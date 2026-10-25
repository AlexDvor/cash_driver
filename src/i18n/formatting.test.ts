import {
  centsToInput,
  formatLocalDateTime,
  formatLocalDate,
  formatMoney,
  formatPeriodRange,
} from './formatting';
import { translate } from './translations';

test('Home date follows the explicit local day without displaying time', () => {
  const instant = new Date('2026-10-18T23:30:00Z');
  expect(formatLocalDate(instant, 'en-GB', 'Europe/Madrid')).toBe(
    '19 Oct 2026',
  );
  expect(formatLocalDate(instant, 'en-GB', 'America/New_York')).toBe(
    '18 Oct 2026',
  );
  for (const locale of ['es-ES', 'en-GB']) {
    expect(formatLocalDate(instant, locale, 'Europe/Madrid')).not.toMatch(
      /\d:\d/,
    );
  }
});

test('compact quick amounts hide only zero fractions', () => {
  expect(formatMoney(2000, 'es-ES', true)).toMatch(/^20\s*€$/);
  expect(formatMoney(2000, 'en-GB', true)).toBe('€20');
  expect(formatMoney(2050, 'es-ES', true)).toMatch(/^20,50\s*€$/);
  expect(formatMoney(2000, 'es-ES')).toMatch(/^20,00\s*€$/);
});
test('formats integer cents in all supported locales without feeding grouping into raw inputs', () => {
  expect(formatMoney(2050, 'es-ES')).toMatch(/20,50.*€/);
  expect(formatMoney(2050, 'en-GB')).toBe('€20.50');
  expect(centsToInput(999999)).toBe('9999,99');
  expect(() => formatMoney(1.5, 'es-ES')).toThrow();
  expect(
    translate('es', 'savedPaymentWithTip', { fare: '18,00 €', tip: '2,00 €' }),
  ).toContain('Propina: 2,00 €');
});

test('inclusive display dates use the explicit zone, including a short DST day and a year-spanning week', () => {
  const day = {
    start: new Date('2026-03-28T23:00:00Z'),
    end: new Date('2026-03-29T22:00:00Z'),
  };
  for (const locale of ['es-ES', 'en-GB']) {
    const range = formatPeriodRange(day, locale, 'Europe/Madrid');
    expect(range).toContain('29');
    expect(range).not.toContain(' – ');
  }
  const week = formatPeriodRange(
    {
      start: new Date('2026-12-27T23:00:00Z'),
      end: new Date('2027-01-03T23:00:00Z'),
    },
    'en-GB',
    'Europe/Madrid',
  );
  expect(week).toBe('28 Dec 2026 – 3 Jan 2027');
});
test('date formatting uses explicit device zone and 24-hour time', () => {
  for (const locale of ['es-ES', 'en-GB']) {
    expect(
      formatLocalDateTime(
        new Date('2026-10-08T10:28:00Z'),
        locale,
        'Europe/Madrid',
      ),
    ).toContain('12:28');
  }
});
