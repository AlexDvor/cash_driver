export type SummaryPeriod = 'day' | 'week' | 'month';
export interface PeriodBounds {
  start: Date;
  end: Date;
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
  const date = new Date(
    calendarTimestamp(part('year'), part('month'), part('day')),
  );
  date.setUTCHours(part('hour'), part('minute'), part('second'), 0);
  return date.getTime();
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
