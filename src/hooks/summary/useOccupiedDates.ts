import { CalendarMonth } from '../../features/summary/periods';
import { ActivityStatus, useCalendarActivity } from './useCalendarActivity';

export type OccupiedDatesState = {
  status: ActivityStatus;
  dates: string[] | null;
};
export function useOccupiedDates(
  month: Readonly<CalendarMonth>,
  timeZone: string,
  enabled = true,
) {
  const { year, month: monthNumber } = month;
  const activity = useCalendarActivity<string>(
    `${year}/${monthNumber}/${timeZone}`,
    enabled,
    12,
    services =>
      services.transactions.occupiedDates(
        { year, month: monthNumber },
        timeZone,
      ),
  );
  const state: OccupiedDatesState = {
    status: activity.status,
    dates: activity.data,
  };
  return {
    state,
    requestId: activity.requestId,
    refresh: activity.refresh,
    retry: activity.refresh,
  };
}
