import { useMemo } from 'react';
import { PeriodBounds, getDayRanges } from '../../features/summary/periods';
import { useCalendarActivity } from './useCalendarActivity';

// Retained cash per local day of the period, for the Resumen mini chart.
// `dayKey` changes at local midnight, so "today" is recomputed only then.
export function useDailyNetCash(
  bounds: Readonly<PeriodBounds>,
  timeZone: string,
  now: Date,
  dayKey: string,
  enabled: boolean,
) {
  const start = bounds.start.getTime();
  const end = bounds.end.getTime();
  const days = useMemo(
    () =>
      getDayRanges({ start: new Date(start), end: new Date(end) }, timeZone),
    [start, end, timeZone],
  );
  const nowTime = now.getTime();
  const todayIndex = useMemo(
    () =>
      days.findIndex(
        day => nowTime >= day.start.getTime() && nowTime < day.end.getTime(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, dayKey],
  );
  const activity = useCalendarActivity<number>(
    `${start}/${end}/${timeZone}`,
    enabled,
    6,
    services => services.transactions.dailyNetCash(days),
  );
  return {
    status: activity.status,
    totals: activity.data,
    days,
    todayIndex,
  };
}
