import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { useOccupiedDates } from '../../hooks/summary/useOccupiedDates';
import { CalendarModal } from '../CalendarModal/CalendarModal';
import { CalendarPeriodSelector } from '../CalendarPeriodSelector/CalendarPeriodSelector';
import { CalendarNavigationProps } from './CalendarNavigation.interface';

// One shared composition; screens retain their independent calendar hook instances.
export function CalendarNavigation({
  calendar,
  timeZone,
  todayDateKey,
}: CalendarNavigationProps) {
  const trigger = useRef<React.ElementRef<typeof View>>(null);
  const open = calendar.draftMonth !== null;
  const wasOpen = useRef(false);
  const activity = useOccupiedDates(
    calendar.draftMonth ?? calendar.month,
    timeZone,
    open,
  );
  useEffect(() => {
    const dismissed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!dismissed) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(trigger.current);
      if (handle != null) {
        AccessibilityInfo.setAccessibilityFocus(handle);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

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
