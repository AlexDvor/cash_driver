import { useMemo } from 'react';
import {
  CalendarMonth,
  getCalendarMonthOf,
} from '../../features/summary/periods';
import { compareCalendarMonths } from '../../components/CalendarModal/calendarPresentation';
import { useCalendarActivity } from './useCalendarActivity';

// Months a calendar may browse: from the first month with an operation (or the
// current month for an empty store) up to the current month. `min` stays null
// until the read succeeds, so a slow or failed read never blocks navigation.
export function useCalendarRange(
  timeZone: string,
  currentMonth: CalendarMonth,
  keep: readonly CalendarMonth[] = [],
) {
  const activity = useCalendarActivity<string>(
    'earliest-operation',
    true,
    1,
    async services => {
      const earliest = await services.transactions.earliestOperation();
      return earliest ? [earliest] : [];
    },
  );
  const earliest = activity.data;
  const keepKey = keep.map(month => `${month.year}/${month.month}`).join(',');
  return useMemo(() => {
    let min: CalendarMonth | null = null;
    if (earliest) {
      min = earliest.length
        ? getCalendarMonthOf(new Date(earliest[0]), timeZone)
        : currentMonth;
    }
    let max = currentMonth;
    // Never strand the user outside the range: keep the shown months reachable.
    for (const month of keep) {
      if (min && compareCalendarMonths(month, min) < 0) min = month;
      if (compareCalendarMonths(month, max) > 0) max = month;
    }
    return { min, max };
    // `keepKey` encodes `keep`; `currentMonth` is read by its coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earliest, timeZone, currentMonth.year, currentMonth.month, keepKey]);
}
