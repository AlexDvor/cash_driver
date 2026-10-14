import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  AccessibilityInfo,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sizing, spacing } from '../../constants/theme/tokens';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import {
  calendarDisplayDate,
  calendarMonthLabel,
  offsetCalendarMonth,
} from './calendarPresentation';
import { CalendarModalProps } from './CalendarModal.interface';
import { styles } from './CalendarModal.styles';
import { CalendarGrid } from '../CalendarGrid/CalendarGrid';
import { CalendarChevron, CalendarIcon } from './CalendarIcon';

export function CalendarModal(props: CalendarModalProps) {
  const { draftMonth } = props;
  // The inner session unmounts on cancel/apply, so reopening never retains picker mode.
  if (!draftMonth) {
    return null;
  }
  return <CalendarSession {...props} draftMonth={draftMonth} />;
}

function CalendarSession({
  monthOnly = false,
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
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [pickingMonth, setPickingMonth] = useState(monthOnly);
  const heading = useRef<React.ElementRef<typeof View>>(null);
  const focusFrame = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (focusFrame.current != null) cancelAnimationFrame(focusFrame.current);
    },
    [],
  );
  const compact =
    width - insets.left - insets.right <
    sizing.touchTarget * 7 + spacing.lg * 4 + sizing.borderWidth * 2;
  const horizontalPadding = compact && !monthOnly ? spacing.xs : spacing.lg;
  const label = calendarMonthLabel(draftMonth, locale);
  const headingLabel = pickingMonth
    ? new Intl.NumberFormat(locale, { useGrouping: false }).format(
        draftMonth.year,
      )
    : label;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={onCancel}
      onShow={() => {
        if (focusFrame.current != null)
          cancelAnimationFrame(focusFrame.current);
        focusFrame.current = requestAnimationFrame(() => {
          if (heading.current != null)
            AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
        });
      }}
    >
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
              <View
                ref={heading}
                accessible
                accessibilityRole="header"
                accessibilityLabel={t(
                  pickingMonth ? 'calendarMonthTitle' : 'calendarTitle',
                )}
                style={styles.heading}
              >
                <AppText variant="heading" accessible={false}>
                  {t(pickingMonth ? 'calendarMonthTitle' : 'calendarTitle')}
                </AppText>
              </View>
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
              {!monthOnly && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    pickingMonth
                      ? 'calendarShowDays'
                      : 'calendarSelectMonthYear',
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
                  <CalendarIcon />
                </Pressable>
              )}
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
              <CalendarGrid
                draftMonth={draftMonth}
                selectedDate={selectedDate}
                todayDateKey={todayDateKey}
                occupiedDates={occupiedDates}
                activityStatus={activityStatus}
                onApplyDay={onApplyDay}
                onRetryActivity={onRetryActivity}
              />
            )}
            {pickingMonth && (
              <AppText variant="heading" style={styles.pickerPreview}>
                {label}
              </AppText>
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
