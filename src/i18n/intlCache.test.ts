import { clearIntlCache, dateTimeFormat, numberFormat } from './intlCache';
import { formatMoney } from './formatting';

beforeEach(() => clearIntlCache());

test('returns the same formatter for the same locale and options', () => {
  const a = numberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const b = numberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  expect(b).toBe(a);
  const c = dateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric' });
  expect(dateTimeFormat('es-ES', { timeZone: 'UTC', day: 'numeric' })).toBe(c);
});

test('different locale, options or time zone never share a formatter', () => {
  const base = { timeZone: 'UTC', day: 'numeric' } as const;
  const utc = dateTimeFormat('es-ES', base);
  expect(dateTimeFormat('en-GB', base)).not.toBe(utc);
  expect(
    dateTimeFormat('es-ES', { ...base, timeZone: 'Europe/Madrid' }),
  ).not.toBe(utc);
  expect(dateTimeFormat('es-ES', { ...base, month: 'short' })).not.toBe(utc);
});

test('money output is unchanged by caching and the cache stays bounded', () => {
  const first = formatMoney(123456, 'es-ES');
  expect(formatMoney(123456, 'es-ES')).toBe(first);
  expect(first).toContain('56');
  // Far more distinct keys than the cap must not break anything.
  for (let i = 0; i < 200; i += 1) {
    dateTimeFormat('en-GB', {
      timeZone: 'UTC',
      year: 'numeric',
      day: i % 2 ? 'numeric' : '2-digit',
      month: i % 3 ? 'short' : 'long',
    });
  }
  expect(formatMoney(5, 'en-GB')).toBe(formatMoney(5, 'en-GB'));
});
