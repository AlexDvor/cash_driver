import { useCalendarSelection } from '../../hooks/summary/useCalendarSelection';

export interface CalendarNavigationProps {
  calendar: ReturnType<typeof useCalendarSelection>;
  timeZone: string;
  todayDateKey: string;
}
