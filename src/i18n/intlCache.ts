// Constructing an Intl formatter (ICU) is far more expensive than using one, and
// money/date formatting runs for every row and on every clock tick. Formatters
// are immutable, so one instance per (locale, options) is shared.
//
// Only use these with an explicit `timeZone` (or none, for number formats): a
// formatter that relies on the device's default zone would keep a stale zone.
const MAX_ENTRIES = 64;
const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();

function keyOf(locale: string | undefined, options: object): string {
  return `${locale ?? ''}|${JSON.stringify(options)}`;
}

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
  return value;
}

export function numberFormat(
  locale: string | undefined,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = keyOf(locale, options);
  return (
    numberCache.get(key) ??
    remember(numberCache, key, new Intl.NumberFormat(locale, options))
  );
}

export function dateTimeFormat(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = keyOf(locale, options);
  return (
    dateCache.get(key) ??
    remember(dateCache, key, new Intl.DateTimeFormat(locale, options))
  );
}

// Test hook: start from a cold cache (e.g. to count constructions).
export function clearIntlCache(): void {
  numberCache.clear();
  dateCache.clear();
}
