import React from 'react';
import { View } from 'react-native';
import { CalendarMonth } from '../../features/summary/periods';
import { CalendarSelection } from '../../hooks/summary/useCalendarSelection';

export interface CalendarPeriodSelectorProps {
  selection: CalendarSelection;
  onMoveMonth: (delta: number) => void;
  onOpenCalendar: () => void;
  onReturnToMonth: () => void;
  calendarButtonRef?: React.Ref<React.ElementRef<typeof View>>;
  embedded?: boolean;
  // Browsable range; a missing bound means unbounded.
  minMonth?: CalendarMonth | null;
  maxMonth?: CalendarMonth | null;
}
