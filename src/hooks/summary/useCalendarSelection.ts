import { useMemo, useState } from 'react';
import {
  CalendarDate,
  CalendarMonth,
  getCalendarDayBounds,
  getCalendarMonthBounds,
} from '../../features/summary/periods';
import { useLocalClock } from '../app/useLocalClock';

export type CalendarSelection =
  | { kind: 'automatic'; month: CalendarMonth }
  | { kind: 'month'; month: CalendarMonth }
  | { kind: 'day'; month: CalendarMonth; date: CalendarDate };

export function useCalendarSelection(clock: ReturnType<typeof useLocalClock>) {
  const [explicit, setExplicit] = useState<Exclude<
    CalendarSelection,
    { kind: 'automatic' }
  > | null>(null);
  const [draftMonth, setDraftMonth] = useState<CalendarMonth | null>(null);
  const automaticMonth = (() => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: clock.timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(clock.now);
    return {
      year: Number(parts.find(part => part.type === 'year')?.value),
      month: Number(parts.find(part => part.type === 'month')?.value),
    };
  })();
  const { year: automaticYear, month: automaticMonthNumber } = automaticMonth;
  const selection = useMemo<CalendarSelection>(
    () =>
      explicit ?? {
        kind: 'automatic',
        month: { year: automaticYear, month: automaticMonthNumber },
      },
    [explicit, automaticYear, automaticMonthNumber],
  );
  const bounds = useMemo(
    () =>
      selection.kind === 'day'
        ? getCalendarDayBounds(selection.date, clock.timeZone)
        : getCalendarMonthBounds(selection.month, clock.timeZone),
    [selection, clock.timeZone],
  );
  function browseMonth(month: CalendarMonth) {
    getCalendarMonthBounds(month, clock.timeZone);
    setDraftMonth({ ...month });
  }
  function applyMonth(month = draftMonth ?? selection.month) {
    getCalendarMonthBounds(month, clock.timeZone);
    setExplicit({ kind: 'month', month: { ...month } });
    setDraftMonth(null);
  }
  function applyDay(date: CalendarDate) {
    getCalendarDayBounds(date, clock.timeZone);
    setExplicit({
      kind: 'day',
      month: { year: date.year, month: date.month },
      date: { ...date },
    });
    setDraftMonth(null);
  }
  function moveMonth(delta: number) {
    if (!Number.isInteger(delta)) {
      throw new RangeError('Invalid month offset');
    }
    const date = new Date(0);
    date.setUTCFullYear(
      selection.month.year,
      selection.month.month - 1 + delta,
      1,
    );
    applyMonth({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 });
  }
  return {
    selection,
    month: selection.month,
    bounds,
    draftMonth,
    openCalendar: () => setDraftMonth({ ...selection.month }),
    cancelCalendar: () => setDraftMonth(null),
    browseMonth,
    applyMonth,
    applyDay,
    moveMonth,
    returnToMonth: () => applyMonth(selection.month),
  };
}
