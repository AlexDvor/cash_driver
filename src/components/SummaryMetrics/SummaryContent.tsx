import React from 'react';
import { View } from 'react-native';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { Card } from '../../ui/Card/Card';
import { AppText } from '../../ui/AppText/AppText';
import { platforms } from '../../constants/platforms';
import { spacing } from '../../constants/theme/tokens';
import { formatMoney } from '../../i18n/formatting';
import type { CashSummary } from '../../features/summary/summary';
import { PlatformSummaryRow } from '../PlatformSummaryRow/PlatformSummaryRow';
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
  return (
    <View style={{ gap: spacing.lg }}>
      <RetainedCashCard
        label={t('retainedCash')}
        amount={summary ? formatMoney(summary.netCashTotalCents, locale) : ''}
        countLabel={
          summary ? `${t('operationCount')}: ${summary.operationCount}` : ''
        }
      />
      <SummaryStatCards
        fareLabel={t('fareTotal')}
        fareAmount={summary ? formatMoney(summary.fareTotalCents, locale) : ''}
        tipLabel={t('tipsTotal')}
        tipAmount={summary ? formatMoney(summary.tipTotalCents, locale) : ''}
      />
      <Card depth>
        <SummaryMetric
          icon="average"
          label={t('averageFare')}
          amount={summary ? formatMoney(summary.averageFareCents, locale) : ''}
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
              platform={platform}
              divided={index > 0}
              amount={
                summary
                  ? formatMoney(summary.fareByPlatformCents[platform], locale)
                  : ''
              }
            />
          ))}
        </View>
      </Card>
      {showEmpty && (
        <AppText testID="summary-empty">{t('summaryEmpty')}</AppText>
      )}
    </View>
  );
}
