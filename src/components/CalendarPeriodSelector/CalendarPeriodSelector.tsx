import React from 'react';
import { Pressable, View } from 'react-native';
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
import { CalendarChevron, CalendarIcon } from '../CalendarModal/CalendarIcon';

export function CalendarPeriodSelector({
  selection,
  onMoveMonth,
  onOpenCalendar,
  onReturnToMonth,
  calendarButtonRef,
}: CalendarPeriodSelectorProps) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendarPreviousMonth')}
          onPress={() => onMoveMonth(-1)}
          style={styles.button}
        >
          <CalendarChevron color={colors.text} previous />
        </Pressable>
        <AppText style={styles.label}>
          {selection.kind === 'day'
            ? calendarFullDateLabel(selection.date, locale)
            : calendarMonthLabel(selection.month, locale)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('calendarNextMonth')}
          onPress={() => onMoveMonth(1)}
          style={styles.button}
        >
          <CalendarChevron color={colors.text} />
        </Pressable>
        <Pressable
          ref={calendarButtonRef}
          accessibilityRole="button"
          accessibilityLabel={t('calendarOpen')}
          onPress={onOpenCalendar}
          style={[styles.button, { backgroundColor: colors.softGreen }]}
        >
          <CalendarIcon color={colors.primary} />
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
