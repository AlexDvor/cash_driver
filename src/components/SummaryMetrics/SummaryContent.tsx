import React, { useLayoutEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { Card } from '../../ui/Card/Card';
import { AppText } from '../../ui/AppText/AppText';
import { LoadingSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { platforms } from '../../constants/platforms';
import { spacing } from '../../constants/theme/tokens';
import { formatMoney } from '../../i18n/formatting';
import type { CashSummary } from '../../features/summary/summary';
import { PlatformSummaryRow } from '../PlatformSummaryRow/PlatformSummaryRow';
import { styles } from './SummaryMetrics.styles';
import {
  RetainedCashCard,
  SummaryMetric,
  SummaryStatCards,
} from './SummaryMetrics';

export function SummaryContent({
  summary,
  showEmpty = false,
}: {
  summary: CashSummary | null;
  showEmpty?: boolean;
}) {
  const { t, locale } = useTranslation();
  const loading = summary === null;
  // Previous values supply hidden text geometry only, never new-period results.
  const previous = useRef<CashSummary | null>(null);
  const previousEmpty = useRef(false);
  useLayoutEffect(() => {
    if (summary) {
      previous.current = summary;
      previousEmpty.current = showEmpty;
    }
  }, [summary, showEmpty]);
  const geometry = summary ?? previous.current;
  return (
    <LoadingSkeleton
      loading={loading}
      preserveHeight
      label={t('summaryLoading')}
      style={{ gap: spacing.lg }}
    >
      <RetainedCashCard
        loading={loading}
        label={t('retainedCash')}
        amount={geometry ? formatMoney(geometry.netCashTotalCents, locale) : ''}
        countLabel={`${t('operationCount')}: ${geometry?.operationCount ?? ''}`}
      />
      <SummaryStatCards
        loading={loading}
        fareLabel={t('fareTotal')}
        fareAmount={
          geometry ? formatMoney(geometry.fareTotalCents, locale) : ''
        }
        tipLabel={t('tipsTotal')}
        tipAmount={geometry ? formatMoney(geometry.tipTotalCents, locale) : ''}
      />
      <Card depth>
        <SummaryMetric
          icon="average"
          loading={loading}
          label={t('averageFare')}
          amount={
            geometry ? formatMoney(geometry.averageFareCents, locale) : ''
          }
          testID="summary-averageFare"
        />
      </Card>
      <Card depth>
        <AppText variant="heading" accessibilityRole="header">
          {t('byPlatform')}
        </AppText>
        <View>
          {platforms.map((platform, index) => (
            <PlatformSummaryRow
              key={platform}
              loading={loading}
              platform={platform}
              divided={index > 0}
              amount={
                geometry
                  ? formatMoney(geometry.fareByPlatformCents[platform], locale)
                  : ''
              }
            />
          ))}
        </View>
      </Card>
      {(showEmpty || (loading && previousEmpty.current)) && (
        <AppText
          testID={loading ? undefined : 'summary-empty'}
          style={loading && styles.hidden}
        >
          {t('summaryEmpty')}
        </AppText>
      )}
    </LoadingSkeleton>
  );
}
