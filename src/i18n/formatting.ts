// Formatting never feeds decimal euros back into arithmetic or editable inputs.
export function formatMoney(cents: number, locale: string): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError('Invalid cents');
  }
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, '0');
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(whole)
    .map(part => (part.type === 'fraction' ? fraction : part.value))
    .join('');
}

export function centsToInput(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError('Invalid cents');
  }
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

export function formatLocalDateTime(
  date: Date,
  locale: string,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
