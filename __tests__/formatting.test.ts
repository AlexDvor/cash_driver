import {
  centsToInput,
  formatLocalDateTime,
  formatMoney,
  formatPeriodRange,
} from '../src/i18n/formatting';
import { translate } from '../src/i18n/translations';
test('formats integer cents in all supported locales without feeding grouping into raw inputs', () => {
  expect(formatMoney(2050, 'es-ES')).toMatch(/20,50.*€/);
  expect(formatMoney(2050, 'en-GB')).toBe('€20.50');
  expect(formatMoney(2050, 'uk-UA')).toMatch(/20,50.*€/);
  expect(centsToInput(999999)).toBe('9999,99');
  expect(() => formatMoney(1.5, 'es-ES')).toThrow();
  expect(
    translate('uk', 'savedPaymentWithTip', { fare: '18,00 €', tip: '2,00 €' }),
  ).toContain('Чайові: 2,00 €');
});

test('inclusive display dates use the explicit zone, including a short DST day and a year-spanning week', () => {
  const day = {
    start: new Date('2026-03-28T23:00:00Z'),
    end: new Date('2026-03-29T22:00:00Z'),
  };
  for (const locale of ['es-ES', 'en-GB', 'uk-UA']) {
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
  for (const locale of ['es-ES', 'en-GB', 'uk-UA']) {
    expect(
      formatLocalDateTime(
        new Date('2026-10-08T10:28:00Z'),
        locale,
        'Europe/Madrid',
      ),
    ).toContain('12:28');
  }
});
