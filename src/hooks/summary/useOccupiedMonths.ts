import { useCalendarActivity } from './useCalendarActivity';

export function useOccupiedMonths(
  year: number,
  timeZone: string,
  enabled: boolean,
) {
  const activity = useCalendarActivity<number>(
    `${year}/${timeZone}`,
    enabled,
    3,
    services => services.transactions.occupiedMonths(year, timeZone),
  );
  return {
    state: { status: activity.status, months: activity.data },
    requestId: activity.requestId,
    retry: activity.refresh,
  };
}
