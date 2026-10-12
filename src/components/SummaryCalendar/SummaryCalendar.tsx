import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useOccupiedDates } from '../../hooks/summary/useOccupiedDates';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { Card } from '../../ui/Card/Card';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { CalendarGrid } from '../CalendarGrid/CalendarGrid';
import { CalendarModal } from '../CalendarModal/CalendarModal';
import { CalendarPeriodSelector } from '../CalendarPeriodSelector/CalendarPeriodSelector';
import { CalendarNavigationProps } from '../CalendarNavigation/CalendarNavigation.interface';

export function SummaryCalendar({
  calendar,
  timeZone,
  todayDateKey,
}: CalendarNavigationProps) {
  const focused = useIsFocused();
  const { t } = useTranslation();
  const trigger = useRef<React.ElementRef<typeof View>>(null);
  const open = focused && calendar.draftMonth !== null;
  const wasOpen = useRef(false);
  // Only one applied-month activity query, independent of the draft chooser.
  const activity = useOccupiedDates(calendar.month, timeZone, focused);
  useEffect(() => {
    const dismissed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!dismissed || !focused) return;
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(trigger.current);
      if (handle != null) AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, focused]);
  const gridProps = {
    draftMonth: calendar.month,
    selectedDate:
      calendar.selection.kind === 'day' ? calendar.selection.date : null,
    todayDateKey,
    occupiedDates: activity.state.dates ?? [],
    activityStatus:
      activity.state.status === 'idle'
        ? ('loading' as const)
        : activity.state.status,
    onApplyDay: calendar.applyDay,
    onRetryActivity: activity.retry,
  };
  return (
    <>
      <View
        accessibilityElementsHidden={open}
        importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
      >
        <Card>
          <CalendarPeriodSelector
            selection={{ kind: 'month', month: calendar.month }}
            onMoveMonth={calendar.moveMonth}
            onOpenCalendar={calendar.openCalendar}
            onReturnToMonth={calendar.returnToMonth}
            calendarButtonRef={trigger}
          />
          <CalendarGrid {...gridProps} />
          {calendar.selection.kind === 'day' && (
            <ActionButton
              variant="secondary"
              label={t('calendarReturnToMonth')}
              onPress={calendar.returnToMonth}
            />
          )}
        </Card>
      </View>
      <CalendarModal
        {...gridProps}
        monthOnly
        draftMonth={open ? calendar.draftMonth : null}
        onBrowseMonth={calendar.browseMonth}
        onApplyMonth={calendar.applyMonth}
        onCancel={calendar.cancelCalendar}
      />
    </>
  );
}
