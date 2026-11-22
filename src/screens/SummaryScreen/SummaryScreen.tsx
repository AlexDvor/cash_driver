import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';

import { useDailyNetCash } from '../../hooks/summary/useDailyNetCash';
import type { SummaryChartData } from '../../components/SummaryMetrics/SummaryMetrics.interface';

function formatChartDay(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone,
  }).format(date);
}

export function SummaryScreen() {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { services } = usePersistence();
  const [period, setPeriod] = useState<SummaryPeriod>('day');
  const clock = useLocalClock();
  const calendar = useCalendarSelection(clock);
  const cancelCalendar = useRef(calendar.cancelCalendar);
  cancelCalendar.current = calendar.cancelCalendar;
  useFocusEffect(useCallback(() => () => cancelCalendar.current(), []));
  const { state, bounds, refresh, retainedSummary, refreshError } =
    usePeriodSummary(
      period,
      clock,
      calendar.selection.kind === 'day'
        ? calendar.selection.date
        : calendar.month,
    );
  // Daily bars only for Semana and Mes, never Hoy or a single selected day.
  const daily = useDailyNetCash(
    bounds,
    clock.timeZone,
    clock.now,
    clock.dayKey,
    period !== 'day',
  );
  const chart: SummaryChartData | null =
    period !== 'day' && daily.days.length > 1 && daily.status !== 'error'
      ? {
          values: daily.totals ?? [],
          loading: daily.totals === null,
          todayIndex: daily.todayIndex,
          startLabel: formatChartDay(
            daily.days[0].start,
            locale,
            clock.timeZone,
          ),
          endLabel: formatChartDay(
            daily.days[daily.days.length - 1].start,
            locale,
            clock.timeZone,
          ),
        }
      : null;
  const current = {
    summary: state.summary ?? retainedSummary,
    bounds,
    period,
    selection: calendar.selection,
    timeZone: clock.timeZone,
    services,
  };
  const completed = useRef<typeof current | null>(null);
  useLayoutEffect(() => {
    if (state.status === 'ready') {
      completed.current = current;
    }
  });
  // Keep date and totals from the same completed read until the next read is
  // ready. Never retain data across persistence service replacement.
  const displayed =
    state.status === 'loading' && completed.current?.services === services
      ? completed.current
      : current;
  const { summary } = displayed;
  const periodLabel =
    displayed.period === 'month' &&
    displayed.selection.kind === 'day' &&
    displayed.bounds.start.getTime() === displayed.bounds.end.getTime()
      ? calendarFullDateLabel(displayed.selection.date, locale)
      : formatPeriodRange(displayed.bounds, locale, displayed.timeZone);
  return (
    <ScreenContainer>
      <AppText variant="title" accessibilityRole="header">
        {t('summary')}
      </AppText>
      <ChoiceGroup
        hideLabel
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
          summary={summary}
          showEmpty={summary?.operationCount === 0}
          chart={chart}
        />
      )}
      {refreshError && (
        <Card>
          <AppText accessibilityLiveRegion="polite">
            {t('dataRefreshFailed')}
          </AppText>
          <ActionButton label={t('retry')} onPress={refresh} />
        </Card>
      )}
    </ScreenContainer>
  );
}
