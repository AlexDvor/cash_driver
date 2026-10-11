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
import { sizing, spacing, typography } from '../../constants/theme/tokens';
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
import { CalendarChevron, CalendarIcon } from './CalendarIcon';

// Remove the library's adjustable header as well as its visible text. All
// month navigation belongs to the controlled draft above the calendar grid.
function EmptyCalendarHeader() {
  return null;
}

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
  const { colors, appearance } = useAppTheme();
  const { height, fontScale, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [pickingMonth, setPickingMonth] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const compact =
    width - insets.left - insets.right <
    sizing.touchTarget * 7 + spacing.lg * 4 + sizing.borderWidth * 2;
  const horizontalPadding = compact ? spacing.xs : spacing.lg;
  // Fit all seven columns when touch targets and scaled digits fit the panel.
  // Very narrow windows retain horizontal scrolling rather than shrink targets.
  const calendarWidth = Math.max(
    Math.max(
      sizing.touchTarget,
      Math.ceil(typography.body * fontScale * 1.5 + spacing.md),
    ) * 7,
    viewportWidth,
  );
  const label = calendarMonthLabel(draftMonth, locale);
  const headingLabel = pickingMonth
    ? new Intl.NumberFormat(locale, { useGrouping: false }).format(
        draftMonth.year,
      )
    : label;

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
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            paddingLeft: insets.left + horizontalPadding,
            paddingRight: insets.right + horizontalPadding,
          },
        ]}
      >
        <Pressable
          testID="calendar-backdrop"
          accessible={false}
          onPress={onCancel}
          style={[
            styles.backdrop,
            {
              backgroundColor:
                appearance === 'dark' ? colors.background : colors.text,
            },
          ]}
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
            contentContainerStyle={[
              styles.content,
              { paddingHorizontal: horizontalPadding },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.row}>
              <AppText
                variant="heading"
                accessibilityRole="header"
                style={styles.heading}
              >
                {t(pickingMonth ? 'calendarMonthTitle' : 'calendarTitle')}
              </AppText>
              <Pressable
                testID="calendar-close"
                accessibilityRole="button"
                accessibilityLabel={t('cancel')}
                style={styles.control}
                onPress={onCancel}
              >
                <AppText variant="heading" secondary>
                  ×
                </AppText>
              </Pressable>
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
                <CalendarChevron color={colors.text} previous />
              </Pressable>
              <View style={[styles.control, styles.heading]}>
                <AppText variant="heading" style={styles.centered}>
                  {headingLabel}
                </AppText>
              </View>
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
                <CalendarChevron color={colors.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(
                  pickingMonth ? 'calendarShowDays' : 'calendarSelectMonthYear',
                )}
                accessibilityValue={{ text: headingLabel }}
                style={[
                  styles.control,
                  {
                    borderWidth: sizing.borderWidth,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setPickingMonth(value => !value)}
              >
                <CalendarIcon color={colors.secondaryText} />
              </Pressable>
            </View>
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
                  const shortMonthLabel = new Intl.DateTimeFormat(locale, {
                    month: 'short',
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
                              ? colors.primary
                              : colors.background,
                        },
                      ]}
                      onPress={() => {
                        onBrowseMonth({ year: draftMonth.year, month });
                      }}
                    >
                      <AppText
                        style={[
                          month === draftMonth.month && styles.selectedMonth,
                          {
                            color:
                              month === draftMonth.month
                                ? colors.onPrimary
                                : colors.text,
                          },
                        ]}
                      >
                        {shortMonthLabel}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <ScrollView
                horizontal
                onLayout={event =>
                  setViewportWidth(event.nativeEvent.layout.width)
                }
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
            )}
            {pickingMonth ? (
              <AppText variant="heading" style={styles.pickerPreview}>
                {label}
              </AppText>
            ) : (
              <View style={styles.legend}>
                <View
                  accessible={false}
                  style={[
                    styles.legendDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <AppText secondary style={styles.legendLabel}>
                  {t('calendarActivityLegend')}
                </AppText>
              </View>
            )}
            {!pickingMonth && activityStatus === 'loading' && (
              <View style={styles.row}>
                <ActivityIndicator color={colors.primary} />
                <AppText accessibilityLiveRegion="polite">
                  {t('calendarActivityLoading')}
                </AppText>
              </View>
            )}
            {!pickingMonth && activityStatus === 'error' && (
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
            <Pressable
              testID="calendar-cancel"
              accessibilityRole="button"
              accessibilityLabel={t('cancel')}
              style={styles.control}
              onPress={onCancel}
            >
              <AppText style={{ color: colors.primary }}>{t('cancel')}</AppText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
