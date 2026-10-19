import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useOccupiedDates } from '../../hooks/summary/useOccupiedDates';
import { useOccupiedMonths } from '../../hooks/summary/useOccupiedMonths';
import { CalendarModal } from '../CalendarModal/CalendarModal';
import { CalendarPeriodSelector } from '../CalendarPeriodSelector/CalendarPeriodSelector';
import { CalendarNavigationProps } from './CalendarNavigation.interface';

// One shared composition; screens retain their independent calendar hook instances.
export function CalendarNavigation({
  calendar,
  timeZone,
  todayDateKey,
}: CalendarNavigationProps) {
  const focused = useIsFocused();
  const trigger = useRef<React.ElementRef<typeof View>>(null);
  const open = calendar.draftMonth !== null;
  const [pickingMonth, setPickingMonth] = useState(false);
  const monthActivity = useOccupiedMonths(
    (calendar.draftMonth ?? calendar.month).year,
    timeZone,
    open && pickingMonth,
  );
  const wasOpen = useRef(false);
  const activity = useOccupiedDates(
    calendar.draftMonth ?? calendar.month,
    timeZone,
    open && !pickingMonth,
  );
  useEffect(() => {
    const dismissed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!dismissed || !focused) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      if (trigger.current != null) {
        AccessibilityInfo.sendAccessibilityEvent(trigger.current, 'focus');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, focused]);

  return (
    <>
      <CalendarPeriodSelector
        selection={calendar.selection}
        onMoveMonth={calendar.moveMonth}
        onOpenCalendar={calendar.openCalendar}
        onReturnToMonth={calendar.returnToMonth}
        calendarButtonRef={trigger}
      />
      <CalendarModal
        activityHasData={activity.state.dates !== null}
        monthActivityHasData={monthActivity.state.months !== null}
        activityRequestId={activity.requestId}
        monthActivityRequestId={monthActivity.requestId}
        occupiedMonths={monthActivity.state.months ?? []}
        monthActivityStatus={
          monthActivity.state.status === 'idle'
            ? 'loading'
            : monthActivity.state.status
        }
        onRetryMonthActivity={monthActivity.retry}
        onMonthPickerChange={setPickingMonth}
        draftMonth={calendar.draftMonth}
        selectedDate={
          calendar.selection.kind === 'day' ? calendar.selection.date : null
        }
        todayDateKey={todayDateKey}
        occupiedDates={activity.state.dates ?? []}
        activityStatus={
          activity.state.status === 'idle' ? 'loading' : activity.state.status
        }
        onBrowseMonth={calendar.browseMonth}
        onApplyMonth={calendar.applyMonth}
        onApplyDay={calendar.applyDay}
        onCancel={calendar.cancelCalendar}
        onRetryActivity={activity.retry}
      />
    </>
  );
}
