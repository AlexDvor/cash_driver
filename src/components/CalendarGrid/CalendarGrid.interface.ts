import { CalendarModalProps } from '../CalendarModal/CalendarModal.interface';

export type CalendarGridProps = Pick<
  CalendarModalProps,
  | 'draftMonth'
  | 'selectedDate'
  | 'todayDateKey'
  | 'occupiedDates'
  | 'activityStatus'
  | 'activityHasData'
  | 'onApplyDay'
  | 'onRetryActivity'
>;
