import React from 'react';
import { View } from 'react-native';
import { CalendarSelection } from '../../hooks/summary/useCalendarSelection';

export interface CalendarPeriodSelectorProps {
  selection: CalendarSelection;
  onMoveMonth: (delta: number) => void;
  onOpenCalendar: () => void;
  onReturnToMonth: () => void;
  calendarButtonRef?: React.Ref<React.ElementRef<typeof View>>;
  embedded?: boolean;
}
