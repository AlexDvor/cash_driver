import {
  centsToInput,
  formatLocalDateTime,
  formatMoney,
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
