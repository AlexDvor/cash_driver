import React, { useMemo, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import {
  calendarFullDateLabel,
  calendarMonthLabel,
} from '../CalendarModal/calendarPresentation';
import { CalendarPeriodSelectorProps } from './CalendarPeriodSelector.interface';
import { styles } from './CalendarPeriodSelector.styles';
import { sizing, spacing } from '../../constants/theme/tokens';
import ChevronDown from '../../assets/icons/line/chevron-down.svg';
import { CalendarChevron, CalendarIcon } from '../CalendarModal/CalendarIcon';

export function CalendarPeriodSelector({
  selection,
  onMoveMonth,
  onOpenCalendar,
  onReturnToMonth,
  calendarButtonRef,
  embedded = false,
}: CalendarPeriodSelectorProps) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const [panelWidth, setPanelWidth] = useState(0);
  const stacked =
    (panelWidth || width - spacing.xl * 2) / fontScale <
    (selection.kind === 'day' ? 300 : 280);
  const dateLabel =
    selection.kind === 'day'
      ? calendarFullDateLabel(selection.date, locale)
      : calendarMonthLabel(selection.month, locale);
  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        calendarMonthLabel(
          { year: selection.month.year, month: index + 1 },
          locale,
        ),
      ),
    [selection.month.year, locale],
  );
  // A month label stays on one line (shrinks slightly); a full date may wrap.
  const fitProps =
    selection.kind === 'month'
      ? ({
          numberOfLines: 1,
          adjustsFontSizeToFit: true,
          minimumFontScale: 0.75,
        } as const)
      : {};
  const monthButton = (
    <Pressable
      ref={calendarButtonRef}
      accessibilityRole="button"
      accessibilityLabel={t('calendarOpen')}
      accessibilityValue={{ text: dateLabel }}
      onPress={onOpenCalendar}
      style={({ pressed }) => [
        styles.monthButton,
        stacked && styles.fullWidth,
        {
          backgroundColor: pressed ? colors.softGreen : colors.surfaceRaised,
        },
      ]}
    >
      <CalendarIcon />
      <View style={styles.labelFrame}>
        <View
          testID="calendar-period-label-measure"
          style={styles.labelMeasure}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
        >
          {(selection.kind === 'day' ? [dateLabel] : monthLabels).map(
            sample => (
              <AppText
                key={sample}
                accessible={false}
                {...fitProps}
                style={[styles.label, styles.labelSample]}
              >
                {sample}
              </AppText>
            ),
          )}
        </View>
        <View style={styles.labelOverlay} pointerEvents="none">
          <AppText
            testID="calendar-period-visible-label"
            {...fitProps}
            style={styles.label}
          >
            {dateLabel}
          </AppText>
        </View>
      </View>
      <View accessible={false} importantForAccessibility="no-hide-descendants">
        <ChevronDown
          width={sizing.icon - 4}
          height={sizing.icon - 4}
          color={colors.secondaryText}
        />
      </View>
    </Pressable>
  );
  return (
    <View style={styles.container}>
      <View
        onLayout={event => setPanelWidth(event.nativeEvent.layout.width)}
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
          embedded && styles.embedded,
        ]}
      >
        {stacked && monthButton}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendarPreviousMonth')}
          onPress={() => onMoveMonth(-1)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.surfaceRaised },
            pressed && styles.pressed,
          ]}
        >
          <CalendarChevron color={colors.text} previous />
        </Pressable>
        {!stacked && monthButton}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendarNextMonth')}
          onPress={() => onMoveMonth(1)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.surfaceRaised },
            pressed && styles.pressed,
          ]}
        >
          <CalendarChevron color={colors.text} />
        </Pressable>
      </View>
      {selection.kind === 'day' && (
        <ActionButton
          variant="secondary"
          label={t('calendarReturnToMonth')}
          onPress={onReturnToMonth}
        />
      )}
    </View>
  );
}
