export interface CalendarActivityFeedbackProps {
  status: 'loading' | 'error' | 'ready';
  requestKey: string;
  message: string;
  motion: { reduced: boolean; active: boolean };
}

export interface CalendarMonthActivityProps {
  occupied: boolean;
  motion: CalendarActivityFeedbackProps['motion'];
}
