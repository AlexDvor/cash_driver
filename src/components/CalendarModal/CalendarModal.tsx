import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sizing } from '../../constants/theme/tokens';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import {
  calendarDateKey,
  calendarDisplayDate,
  calendarMonthLabel,
  offsetCalendarMonth,
} from './calendarPresentation';
import { CalendarModalProps } from './CalendarModal.interface';
import { styles } from './CalendarModal.styles';
import { CalendarDay, CalendarDayContext } from './CalendarDay';

export function CalendarModal(props: CalendarModalProps) {
  const { draftMonth } = props;
  // The inner session unmounts on cancel/apply, so reopening never retains picker mode.
  if (!draftMonth) {
    return null;
  }
  return <CalendarSession {...props} draftMonth={draftMonth} />;
}

function CalendarSession({
  draftMonth,
  selectedDate,
  todayDateKey,
  occupiedDates,
  activityStatus,
  onBrowseMonth,
  onApplyMonth,
  onApplyDay,
  onCancel,
  onRetryActivity,
}: CalendarModalProps & {
  draftMonth: NonNullable<CalendarModalProps['draftMonth']>;
}) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { height, fontScale, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [pickingMonth, setPickingMonth] = useState(false);
  const calendarWidth = Math.max(
    (sizing.touchTarget + 8) * 7 * Math.max(1, fontScale),
    Math.min(width - 64, sizing.contentMaxWidth - 32),
  );
  const label = calendarMonthLabel(draftMonth, locale);

  const dateKey = calendarDateKey({ ...draftMonth, day: 1 });
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(calendarDisplayDate({ year: 2024, month: 1 }, index + 1)),
  );

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCancel}>
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Pressable
          testID="calendar-backdrop"
          accessible={false}
          onPress={onCancel}
          style={[styles.backdrop, { backgroundColor: colors.text }]}
        />
        <View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={[
            styles.panel,
            {
              maxHeight: height - insets.top - insets.bottom - 32,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.row}>
              <AppText
                variant="heading"
                accessibilityRole="header"
                style={styles.heading}
              >
                {t('calendarTitle')}
              </AppText>
              <ActionButton
                variant="secondary"
                label={t('cancel')}
                onPress={onCancel}
              />
            </View>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(
                  pickingMonth
                    ? 'calendarPreviousYear'
                    : 'calendarPreviousMonth',
                )}
                style={styles.control}
                onPress={() =>
                  onBrowseMonth(
                    pickingMonth
                      ? { ...draftMonth, year: draftMonth.year - 1 }
                      : offsetCalendarMonth(draftMonth, -1),
                  )
                }
              >
                <AppText>‹</AppText>
              </Pressable>
              <AppText variant="heading" style={styles.heading}>
                {pickingMonth
                  ? new Intl.NumberFormat(locale, {
                      useGrouping: false,
                    }).format(draftMonth.year)
                  : label}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(
                  pickingMonth ? 'calendarNextYear' : 'calendarNextMonth',
                )}
                style={styles.control}
                onPress={() =>
                  onBrowseMonth(
                    pickingMonth
                      ? { ...draftMonth, year: draftMonth.year + 1 }
                      : offsetCalendarMonth(draftMonth, 1),
                  )
                }
              >
                <AppText>›</AppText>
              </Pressable>
            </View>
            <ActionButton
              variant="secondary"
              label={t(
                pickingMonth ? 'calendarShowDays' : 'calendarSelectMonthYear',
              )}
              onPress={() => setPickingMonth(value => !value)}
            />
            {pickingMonth ? (
              <View style={styles.grid}>
                {Array.from({ length: 12 }, (_, index) => {
                  const month = index + 1;
                  const monthLabel = new Intl.DateTimeFormat(locale, {
                    month: 'long',
                    timeZone: 'UTC',
                  }).format(
                    calendarDisplayDate({ year: draftMonth.year, month }),
                  );
                  return (
                    <Pressable
                      key={month}
                      accessibilityRole="button"
                      accessibilityLabel={monthLabel}
                      accessibilityState={{
                        selected: month === draftMonth.month,
                      }}
                      style={[
                        styles.control,
                        styles.month,
                        {
                          backgroundColor:
                            month === draftMonth.month
                              ? colors.softGreen
                              : colors.background,
                        },
                      ]}
                      onPress={() => {
                        onBrowseMonth({ year: draftMonth.year, month });
                        setPickingMonth(false);
                      }}
                    >
                      <AppText>{monthLabel}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <ScrollView horizontal>
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
                  <CalendarDayContext.Provider
                    value={{
                      draftMonth,
                      selectedDate,
                      todayDateKey,
                      occupiedDates,
                      activityStatus,
                      onBrowseMonth,
                      onApplyMonth,
                      onApplyDay,
                      onCancel,
                      onRetryActivity,
                    }}
                  >
                    <Calendar
                      key={`${dateKey}-${colors.card}`}
                      style={[
                        styles.calendar,
                        { backgroundColor: colors.card },
                      ]}
                      current={dateKey}
                      firstDay={1}
                      hideArrows
                      hideDayNames
                      hideExtraDays
                      disableMonthChange
                      enableSwipeMonths={false}
                      renderHeader={() => null}
                      theme={{ calendarBackground: colors.card }}
                      dayComponent={CalendarDay}
                    />
                  </CalendarDayContext.Provider>
                </View>
              </ScrollView>
            )}
            <AppText secondary>{t('calendarActivityLegend')}</AppText>
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
            <ActionButton
              label={t('calendarShowMonth')}
              onPress={() => onApplyMonth(draftMonth)}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
