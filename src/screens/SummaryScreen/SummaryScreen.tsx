import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { ActionButton } from '../../components/ActionButton';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useTranslation } from '../../i18n/LanguageProvider';
import { formatMoney, formatPeriodRange } from '../../i18n/formatting';
import { useAppTheme } from '../../theme/ThemeProvider';
import { platformLabels } from '../../features/transactions/history';
import { platforms } from '../../features/transactions/types';
import { SummaryPeriod } from '../../features/summary/periods';
import { usePeriodSummary } from '../../hooks/summary/usePeriodSummary';
import { styles } from './SummaryScreen.styles';

export function SummaryScreen() {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const [period, setPeriod] = useState<SummaryPeriod>('day');
  const clock = useLocalClock();
  const { state, bounds, refresh } = usePeriodSummary(period, clock);
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
      <AppText testID="summary-range" secondary>
        {formatPeriodRange(bounds, locale, clock.timeZone)}
      </AppText>
      {state.status === 'loading' ? (
        <ActivityIndicator
          accessibilityLabel={t('summaryLoading')}
          color={colors.primary}
        />
      ) : state.status === 'error' ? (
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
        <>
          {state.summary.operationCount === 0 && (
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
              {formatMoney(state.summary.netCashTotalCents, locale)}
            </AppText>
            <AppText testID="summary-count" style={{ color: colors.onPrimary }}>
              {t('operationCount')}: {state.summary.operationCount}
            </AppText>
          </Card>
          <Card>
            {(
              [
                { label: 'fareTotal', cents: state.summary.fareTotalCents },
                { label: 'tipsTotal', cents: state.summary.tipTotalCents },
                { label: 'averageFare', cents: state.summary.averageFareCents },
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
                  {formatMoney(
                    state.summary.fareByPlatformCents[platform],
                    locale,
                  )}
                </AppText>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}
