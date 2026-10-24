import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { spacing } from '../../constants/theme/tokens';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { CalendarDay, CalendarDayContext } from '../CalendarModal/CalendarDay';
import {
  calendarDateKey,
  calendarDisplayDate,
  offsetCalendarMonth,
} from '../CalendarModal/calendarPresentation';
import { styles } from '../CalendarModal/CalendarModal.styles';
import { CalendarGridProps } from './CalendarGrid.interface';
import { CalendarDate } from '../../features/summary/periods';

// Remove even the library's hidden adjustable header; navigation is controlled.
function EmptyCalendarHeader() {
  return null;
}

export const CalendarMonthPage = memo(
  function CalendarMonthPageContent({
    props,
    calendarWidth,
  }: {
    props: CalendarGridProps;
    calendarWidth: number;
  }) {
    const { draftMonth } = props;
    const { locale } = useTranslation();
    const { colors } = useAppTheme();
    const year = draftMonth?.year;
    const month = draftMonth?.month;
    // Promoting a prepared page changes activity/selection context. Keep its
    // localized date labels instead of formatting every day again on each read.
    const dateLabels = useMemo(() => {
      if (year == null || month == null) return [];
      const formatter = new Intl.DateTimeFormat(locale, {
        dateStyle: 'full',
        timeZone: 'UTC',
      });
      const days = calendarDisplayDate(
        offsetCalendarMonth({ year, month }, 1),
        0,
      ).getUTCDate();
      return Array.from({ length: days }, (_, index) =>
        formatter.format(calendarDisplayDate({ year, month }, index + 1)),
      );
    }, [locale, year, month]);
    const formatDate = useCallback(
      (date: CalendarDate) => dateLabels[date.day - 1],
      [dateLabels],
    );
    const weekdays = useMemo(() => {
      const formatter = new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        timeZone: 'UTC',
      });
      return Array.from({ length: 7 }, (_, index) =>
        formatter.format(
          calendarDisplayDate({ year: 2024, month: 1 }, index + 1),
        ),
      );
    }, [locale]);
    const context = useMemo(
      () => ({ ...props, formatDate }),
      [props, formatDate],
    );
    if (!draftMonth) return null;
    const dateKey = calendarDateKey({ ...draftMonth, day: 1 });
    const firstWeekday =
      (calendarDisplayDate(draftMonth, 1).getUTCDay() + 6) % 7;
    const daysInMonth = calendarDisplayDate(
      offsetCalendarMonth(draftMonth, 1),
      0,
    ).getUTCDate();
    const paddingWeeks = 6 - Math.ceil((firstWeekday + daysInMonth) / 7);
    return (
      <>
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
          <CalendarDayContext.Provider value={context}>
            <Calendar
              key={`${dateKey}-${colors.card}`}
              style={[styles.calendar, { backgroundColor: colors.card }]}
              current={dateKey}
              firstDay={1}
              hideArrows
              hideDayNames
              // The installed library's showSixWeeks adds only one row to a
              // four-week February. Pad natural weeks ourselves to guarantee six.
              hideExtraDays={false}
              showSixWeeks={false}
              disableMonthChange
              enableSwipeMonths={false}
              customHeader={EmptyCalendarHeader}
              theme={{
                calendarBackground: colors.card,
                weekVerticalMargin: spacing.xs,
              }}
              dayComponent={CalendarDay}
            />
            {Array.from({ length: paddingWeeks }, (_week, week) => (
              <View
                key={week}
                testID={`calendar-padding-week-${week}`}
                style={styles.calendarPaddingWeek}
              >
                {Array.from({ length: 7 }, (_day, day) => (
                  <View key={day} style={{ width: calendarWidth / 7 }}>
                    <CalendarDay />
                  </View>
                ))}
              </View>
            ))}
          </CalendarDayContext.Provider>
        </View>
      </>
    );
  },
  (previous, next) => {
    const a = previous.props;
    const b = next.props;
    return (
      previous.calendarWidth === next.calendarWidth &&
      a.draftMonth?.year === b.draftMonth?.year &&
      a.draftMonth?.month === b.draftMonth?.month &&
      a.selectedDate?.year === b.selectedDate?.year &&
      a.selectedDate?.month === b.selectedDate?.month &&
      a.selectedDate?.day === b.selectedDate?.day &&
      a.todayDateKey === b.todayDateKey &&
      a.occupiedDates === b.occupiedDates &&
      a.activityStatus === b.activityStatus &&
      a.activityHasData === b.activityHasData &&
      a.onApplyDay === b.onApplyDay
    );
  },
);
