import { CalendarDate, CalendarMonth } from '../../features/summary/periods';

export function calendarDateKey(date: CalendarDate): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(
    2,
    '0',
  )}-${String(date.day).padStart(2, '0')}`;
}

export function calendarDisplayDate(month: CalendarMonth, day = 1): Date {
  const date = new Date(0);
  date.setUTCFullYear(month.year, month.month - 1, day);
  return date;
}

export function calendarMonthLabel(
  month: CalendarMonth,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(calendarDisplayDate(month));
}

export function calendarFullDateLabel(
  date: CalendarDate,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(calendarDisplayDate(date, date.day));
}

export function offsetCalendarMonth(
  month: CalendarMonth,
  delta: number,
): CalendarMonth {
  const date = calendarDisplayDate({
    year: month.year,
    month: month.month + delta,
  });
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}
