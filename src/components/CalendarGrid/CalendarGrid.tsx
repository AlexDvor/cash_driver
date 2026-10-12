import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { sizing, spacing, typography } from '../../constants/theme/tokens';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { CalendarDay, CalendarDayContext } from '../CalendarModal/CalendarDay';
import {
  calendarDateKey,
  calendarDisplayDate,
} from '../CalendarModal/calendarPresentation';
import { styles } from '../CalendarModal/CalendarModal.styles';
import { CalendarGridProps } from './CalendarGrid.interface';

// Remove even the library's hidden adjustable header; navigation is controlled.
function EmptyCalendarHeader() {
  return null;
}

export function CalendarGrid(props: CalendarGridProps) {
  const { draftMonth, activityStatus, onRetryActivity } = props;
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const [viewportWidth, setViewportWidth] = useState(0);
  if (!draftMonth) return null;
  // Keep seven usable targets; narrow viewports scroll horizontally, never shrink digits.
  const calendarWidth = Math.max(
    Math.max(
      sizing.touchTarget,
      Math.ceil(typography.body * fontScale * 1.5 + spacing.md),
    ) * 7,
    viewportWidth,
  );
  const dateKey = calendarDateKey({ ...draftMonth, day: 1 });
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(calendarDisplayDate({ year: 2024, month: 1 }, index + 1)),
  );
  return (
    <>
      <ScrollView
        horizontal
        onLayout={event => setViewportWidth(event.nativeEvent.layout.width)}
      >
        <View style={{ width: calendarWidth }}>
          <View style={styles.weekdays}>
            {weekdays.map((weekday, index) => (
              <View key={index} style={{ width: calendarWidth / 7 }}>
                <AppText secondary style={styles.centered}>
                  {weekday}
                </AppText>
              </View>
            ))}
          </View>
          <CalendarDayContext.Provider value={props}>
            <Calendar
              key={`${dateKey}-${colors.card}`}
              style={[styles.calendar, { backgroundColor: colors.card }]}
              current={dateKey}
              firstDay={1}
              hideArrows
              hideDayNames
              hideExtraDays
              disableMonthChange
              enableSwipeMonths={false}
              customHeader={EmptyCalendarHeader}
              theme={{
                calendarBackground: colors.card,
                weekVerticalMargin: spacing.xs,
              }}
              dayComponent={CalendarDay}
            />
          </CalendarDayContext.Provider>
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <View
          accessible={false}
          style={[styles.legendDot, { backgroundColor: colors.primary }]}
        />
        <AppText secondary style={styles.legendLabel}>
          {t('calendarActivityLegend')}
        </AppText>
      </View>
      {activityStatus === 'loading' && (
        <View style={styles.row}>
          <ActivityIndicator color={colors.primary} />
          <AppText accessibilityLiveRegion="polite">
            {t('calendarActivityLoading')}
          </AppText>
        </View>
      )}
      {activityStatus === 'error' && (
        <>
          <AppText
            accessibilityLiveRegion="polite"
            style={{ color: colors.errorText }}
          >
            {t('calendarActivityError')}
          </AppText>
          <ActionButton
            variant="secondary"
            label={t('retry')}
            onPress={onRetryActivity}
          />
        </>
      )}
    </>
  );
}
