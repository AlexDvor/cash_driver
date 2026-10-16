import React, { createContext, useContext } from 'react';
import { Pressable, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { CalendarGridProps } from '../CalendarGrid/CalendarGrid.interface';
import { calendarDateKey, calendarFullDateLabel } from './calendarPresentation';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { styles } from './CalendarModal.styles';

export const CalendarDayContext = createContext<CalendarGridProps | null>(null);

export function CalendarDay({ date }: { date?: DateData }) {
  const context = useContext(CalendarDayContext);
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  if (!date || !context || date.month !== context.draftMonth?.month) {
    return <View />;
  }
  const coordinate = { year: date.year, month: date.month, day: date.day };
  const selected =
    !!context.selectedDate &&
    calendarDateKey(context.selectedDate) === date.dateString;
  const today = context.todayDateKey === date.dateString;
  const unknown = context.activityStatus !== 'ready';
  const occupied = !unknown && context.occupiedDates.includes(date.dateString);
  const activity = unknown
    ? t('calendarActivityUnknown')
    : occupied
    ? t('calendarActivityLegend')
    : t('calendarNoActivity');
  const label = [
    calendarFullDateLabel(coordinate, locale),
    activity,
    today ? t('calendarToday') : '',
    selected ? t('calendarSelected') : '',
  ]
    .filter(Boolean)
    .join(', ');
  const selectionStyle = {
    borderColor: today ? colors.primary : 'transparent',
  };
  const activityStyle = {
    backgroundColor: selected ? colors.primary : 'transparent',
    borderColor: 'transparent',
  };
  const dotStyle = {
    backgroundColor: occupied
      ? selected
        ? colors.onPrimary
        : colors.primary
      : 'transparent',
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => context.onApplyDay(coordinate)}
      style={styles.day}
    >
      <View style={[styles.ring, selectionStyle]}>
        <View style={[styles.circle, activityStyle]}>
          <AppText style={{ color: selected ? colors.onPrimary : colors.text }}>
            {date.day}
          </AppText>
          <View
            testID={`calendar-activity-${date.dateString}`}
            style={[styles.activityDot, dotStyle]}
          />
        </View>
      </View>
    </Pressable>
  );
}
