import { CalendarModalProps } from '../CalendarModal/CalendarModal.interface';
import { CalendarMonth } from '../../features/summary/periods';

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
  | 'onBrowseMonth'
>;

export interface CalendarPagerProps extends CalendarGridProps {
  viewportWidth: number;
  onViewportWidth: (width: number) => void;
  onPagingChange: (paging: boolean) => void;
  onPreviewMonth: (month: CalendarMonth | null) => void;
  active: boolean;
  reducedMotion: boolean;
  resetKey: string;
}

export interface CalendarGridHandle {
  page: (direction: -1 | 1) => void;
}
