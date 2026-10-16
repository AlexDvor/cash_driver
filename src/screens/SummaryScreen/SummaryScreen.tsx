import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatPeriodRange } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { SummaryPeriod } from '../../features/summary/periods';
import { usePeriodSummary } from '../../hooks/summary/usePeriodSummary';
import { useCalendarSelection } from '../../hooks/summary/useCalendarSelection';
import { CalendarNavigation } from '../../components/CalendarNavigation/CalendarNavigation';
import { calendarFullDateLabel } from '../../components/CalendarModal/calendarPresentation';
import { SummaryContent } from '../../components/SummaryMetrics/SummaryContent';

export function SummaryScreen() {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const [period, setPeriod] = useState<SummaryPeriod>('day');
  const clock = useLocalClock();
  const calendar = useCalendarSelection(clock);
  const cancelCalendar = useRef(calendar.cancelCalendar);
  cancelCalendar.current = calendar.cancelCalendar;
  useFocusEffect(useCallback(() => () => cancelCalendar.current(), []));
  const { state, bounds, refresh, retainedSummary, refreshing, refreshError } =
    usePeriodSummary(
      period,
      clock,
      calendar.selection.kind === 'day'
        ? calendar.selection.date
        : calendar.month,
    );
  const summary = state.summary ?? retainedSummary;
  const periodLabel =
    period === 'month' &&
    calendar.selection.kind === 'day' &&
    bounds.start.getTime() === bounds.end.getTime()
      ? calendarFullDateLabel(calendar.selection.date, locale)
      : formatPeriodRange(bounds, locale, clock.timeZone);
  return (
    <ScreenContainer>
      <AppText variant="title" accessibilityRole="header">
        {t('summary')}
      </AppText>
      <ChoiceGroup
        appearance="segmented"
        label={t('period')}
        value={period}
        onChange={next => {
          calendar.cancelCalendar();
          setPeriod(next);
        }}
        options={[
          { value: 'day', label: t('today') },
          { value: 'week', label: t('week') },
          { value: 'month', label: t('month') },
        ]}
      />
      {period === 'month' && (
        <CalendarNavigation
          calendar={calendar}
          timeZone={clock.timeZone}
          todayDateKey={clock.dayKey}
        />
      )}
      <AppText testID="summary-range" secondary>
        {periodLabel}
      </AppText>
      {state.status === 'error' && !summary ? (
        <Card>
          <AppText
            accessibilityRole="alert"
            style={{ color: colors.errorText }}
          >
            {t('summaryFailed')}
          </AppText>
          <ActionButton label={t('retry')} onPress={refresh} />
        </Card>
      ) : (
        <SummaryContent
          periodLabel={periodLabel}
          summary={summary}
          showEmpty={state.status === 'ready' && summary?.operationCount === 0}
        />
      )}
      {(refreshing || refreshError) && (
        <Card>
          {refreshing && <ActivityIndicator color={colors.primary} />}
          <AppText accessibilityLiveRegion="polite">
            {t(refreshing ? 'dataRefreshing' : 'dataRefreshFailed')}
          </AppText>
          {refreshError && (
            <ActionButton label={t('retry')} onPress={refresh} />
          )}
        </Card>
      )}
    </ScreenContainer>
  );
}
