import { CalendarDate, CalendarMonth } from '../../features/summary/periods';

export interface CalendarModalProps {
  monthOnly?: boolean;
  activityHasData?: boolean;
  monthActivityHasData?: boolean;
  activityRequestId?: number;
  monthActivityRequestId?: number;
  occupiedMonths?: readonly number[];
  monthActivityStatus?: 'loading' | 'error' | 'ready';
  onRetryMonthActivity?: () => void;
  onMonthPickerChange?: (visible: boolean) => void;
  draftMonth: CalendarMonth | null;
  selectedDate?: CalendarDate | null;
  todayDateKey: string;
  occupiedDates: readonly string[];
  activityStatus: 'loading' | 'error' | 'ready';
  onBrowseMonth: (month: CalendarMonth) => void;
  onApplyMonth: (month: CalendarMonth) => void;
  onApplyDay: (date: CalendarDate) => void;
  onCancel: () => void;
  onRetryActivity: () => void;
}
