export type SummaryPeriod = 'day' | 'week' | 'month';
export interface PeriodBounds {
  start: Date;
  end: Date;
}

export interface CalendarMonth {
  year: number;
  month: number;
}

export interface CalendarDate extends CalendarMonth {
  day: number;
}

export interface CalendarDayBounds extends PeriodBounds {
  dateKey: string;
}

function calendarTimestamp(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function wallTimestamp(
  instant: number,
  formatter: Intl.DateTimeFormat,
): number {
  const parts = formatter.formatToParts(new Date(instant));
  function part(name: Intl.DateTimeFormatPartTypes): number {
    const value = parts.find(item => item.type === name)?.value;
    if (value === undefined) {
      throw new RangeError(`Missing calendar part: ${name}`);
    }
    return Number(value);
  }
  const era = parts.find(item => item.type === 'era')?.value;
  const year = era === 'BC' ? 1 - part('year') : part('year');
  const date = new Date(calendarTimestamp(year, part('month'), part('day')));
  date.setUTCHours(part('hour'), part('minute'), part('second'), 0);
  return date.getTime();
}

function calendarFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    era: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function validatedCalendar(value: CalendarDate): Date {
  if (
    !Number.isInteger(value.year) ||
    !Number.isInteger(value.month) ||
    !Number.isInteger(value.day) ||
    value.month < 1 ||
    value.month > 12 ||
    value.day < 1 ||
    value.day > 31
  ) {
    throw new RangeError('Invalid calendar coordinates');
  }
  const date = new Date(calendarTimestamp(value.year, value.month, value.day));
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== value.year ||
    date.getUTCMonth() + 1 !== value.month ||
    date.getUTCDate() !== value.day
  ) {
    throw new RangeError('Invalid or unrepresentable calendar date');
  }
  return date;
}

function resolveCalendarBounds(
  startCalendar: Date,
  endCalendar: Date,
  formatter: Intl.DateTimeFormat,
): PeriodBounds {
  if (!Number.isFinite(endCalendar.getTime())) {
    throw new RangeError('Unrepresentable calendar boundary');
  }
  const start = localMidnight(startCalendar, formatter);
  const end = localMidnight(endCalendar, formatter);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start > end
  ) {
    throw new RangeError('Invalid calendar bounds');
  }
  // A completely skipped local date has an empty range, never the next day's data.
  return { start, end };
}

export function getCalendarMonthBounds(
  month: Readonly<CalendarMonth>,
  timeZone: string,
): PeriodBounds {
  const start = validatedCalendar({ ...month, day: 1 });
  const end = new Date(start.getTime());
  end.setUTCMonth(end.getUTCMonth() + 1);
  return resolveCalendarBounds(start, end, calendarFormatter(timeZone));
}

export function getCalendarDayBounds(
  day: Readonly<CalendarDate>,
  timeZone: string,
): PeriodBounds {
  const start = validatedCalendar(day);
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 1);
  return resolveCalendarBounds(start, end, calendarFormatter(timeZone));
}

export function getCalendarMonthDays(
  month: Readonly<CalendarMonth>,
  timeZone: string,
): CalendarDayBounds[] {
  const calendar = validatedCalendar({ ...month, day: 1 });
  const formatter = calendarFormatter(timeZone);
  const days: CalendarDayBounds[] = [];
  while (calendar.getUTCMonth() + 1 === month.month) {
    const next = new Date(calendar.getTime());
    next.setUTCDate(next.getUTCDate() + 1);
    days.push({
      dateKey: calendar.toISOString().split('T')[0],
      ...resolveCalendarBounds(calendar, next, formatter),
    });
    calendar.setTime(next.getTime());
  }
  return days;
}

function localMidnight(calendar: Date, formatter: Intl.DateTimeFormat): Date {
  const desiredWallTime = calendar.getTime();
  const offsets = new Set<number>();
  // Inspect both sides of a possible offset transition, instead of treating a
  // local day as a fixed 24 hours. UTC dates here are only calendar coordinates.
  for (const dayShift of [-1, 0, 1]) {
    const probe = new Date(desiredWallTime);
    probe.setUTCDate(probe.getUTCDate() + dayShift);
    offsets.add(wallTimestamp(probe.getTime(), formatter) - probe.getTime());
  }
  const candidates = [...offsets]
    .map(offset => {
      const instant = desiredWallTime - offset;
      return { instant, wallTime: wallTimestamp(instant, formatter) };
    })
    .filter(candidate => candidate.wallTime >= desiredWallTime);
  // Like Date calendar construction: earliest occurrence for a repeated time;
  // move forward through a gap if local midnight does not exist.
  candidates.sort(
    (left, right) =>
      left.wallTime - right.wallTime || left.instant - right.instant,
  );
  if (candidates.length === 0) {
    throw new RangeError('Cannot resolve local calendar boundary');
  }
  return new Date(candidates[0].instant);
}

export function getPeriodBounds(
  reference: Date,
  period: SummaryPeriod,
  timeZone: string,
): PeriodBounds {
  if (!Number.isFinite(reference.getTime())) {
    throw new RangeError('Invalid reference date');
  }
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const startCalendar = new Date(wallTimestamp(reference.getTime(), formatter));
  startCalendar.setUTCHours(0, 0, 0, 0);
  if (period === 'week') {
    const daysSinceMonday = (startCalendar.getUTCDay() + 6) % 7;
    startCalendar.setUTCDate(startCalendar.getUTCDate() - daysSinceMonday);
  } else if (period === 'month') {
    startCalendar.setUTCDate(1);
  }
  const endCalendar = new Date(startCalendar.getTime());
  if (period === 'month') {
    endCalendar.setUTCMonth(endCalendar.getUTCMonth() + 1);
  } else {
    endCalendar.setUTCDate(
      endCalendar.getUTCDate() + (period === 'week' ? 7 : 1),
    );
  }
  return {
    start: localMidnight(startCalendar, formatter),
    end: localMidnight(endCalendar, formatter),
  };
}

export function isWithinPeriod(
  instant: Date,
  bounds: Readonly<PeriodBounds>,
): boolean {
  const time = instant.getTime();
  if (
    !Number.isFinite(time) ||
    !Number.isFinite(bounds.start.getTime()) ||
    !Number.isFinite(bounds.end.getTime()) ||
    bounds.start >= bounds.end
  ) {
    throw new RangeError('Invalid date or period bounds');
  }
  return time >= bounds.start.getTime() && time < bounds.end.getTime();
}
