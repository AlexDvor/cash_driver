import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatMoney, formatPeriodRange } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { platforms, platformLabels } from '../../constants/platforms';
import { SummaryPeriod } from '../../features/summary/periods';
import { usePeriodSummary } from '../../hooks/summary/usePeriodSummary';
import { useCalendarSelection } from '../../hooks/summary/useCalendarSelection';
import { CalendarNavigation } from '../../components/CalendarNavigation/CalendarNavigation';
import { calendarFullDateLabel } from '../../components/CalendarModal/calendarPresentation';
import { styles } from './SummaryScreen.styles';

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
  return (
    <ScreenContainer>
      <AppText variant="title" accessibilityRole="header">
        {t('summary')}
      </AppText>
      <ChoiceGroup
        label={t('period')}
        value={period}
        onChange={setPeriod}
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
        {period === 'month' &&
        calendar.selection.kind === 'day' &&
        bounds.start.getTime() === bounds.end.getTime()
          ? calendarFullDateLabel(calendar.selection.date, locale)
          : formatPeriodRange(bounds, locale, clock.timeZone)}
      </AppText>
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
      {state.status === 'loading' && !summary ? (
        <ActivityIndicator
          accessibilityLabel={t('summaryLoading')}
          color={colors.primary}
        />
      ) : state.status === 'error' && !summary ? (
        <Card>
          <AppText
            accessibilityRole="alert"
            style={{ color: colors.errorText }}
          >
            {t('summaryFailed')}
          </AppText>
          <ActionButton label={t('retry')} onPress={refresh} />
        </Card>
      ) : summary ? (
        <>
          {state.status === 'ready' && summary.operationCount === 0 && (
            <AppText testID="summary-empty">{t('summaryEmpty')}</AppText>
          )}
          <Card style={{ backgroundColor: colors.primary }}>
            <AppText variant="heading" style={{ color: colors.onPrimary }}>
              {t('retainedCash')}
            </AppText>
            <AppText
              testID="summary-retained"
              style={[styles.money, { color: colors.onPrimary }]}
            >
              {formatMoney(summary.netCashTotalCents, locale)}
            </AppText>
            <AppText testID="summary-count" style={{ color: colors.onPrimary }}>
              {t('operationCount')}: {summary.operationCount}
            </AppText>
          </Card>
          <Card>
            {(
              [
                { label: 'fareTotal', cents: summary.fareTotalCents },
                { label: 'tipsTotal', cents: summary.tipTotalCents },
                { label: 'averageFare', cents: summary.averageFareCents },
              ] as const
            ).map(item => (
              <View key={item.label} style={styles.row}>
                <AppText secondary>{t(item.label)}</AppText>
                <AppText testID={`summary-${item.label}`} style={styles.value}>
                  {formatMoney(item.cents, locale)}
                </AppText>
              </View>
            ))}
          </Card>
          <Card>
            <AppText variant="heading" accessibilityRole="header">
              {t('byPlatform')}
            </AppText>
            {platforms.map(platform => (
              <View key={platform} style={styles.row}>
                <AppText>{platformLabels[platform]}</AppText>
                <AppText testID={`summary-${platform}`} style={styles.value}>
                  {formatMoney(summary.fareByPlatformCents[platform], locale)}
                </AppText>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}
