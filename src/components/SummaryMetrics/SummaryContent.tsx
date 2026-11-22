import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
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
import type { SummaryChartData } from './SummaryMetrics.interface';
import EmptyWallet from '../../assets/illustrations/empty-wallet.svg';

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: spacing.md },
  emptyTitle: { textAlign: 'center' },
});

function sharePercent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function SummaryContent({
  summary,
  showEmpty = false,
  chart = null,
}: {
  summary: CashSummary | null;
  showEmpty?: boolean;
  chart?: SummaryChartData | null;
}) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <RetainedCashCard
        label={t('retainedCash')}
        amount={summary ? formatMoney(summary.netCashTotalCents, locale) : ''}
        countLabel={
          summary ? `${t('operationCount')}: ${summary.operationCount}` : ''
        }
        chart={chart}
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
              share={
                summary
                  ? sharePercent(
                      summary.fareByPlatformCents[platform],
                      summary.fareTotalCents,
                    )
                  : 0
              }
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
        <View style={styles.empty}>
          <EmptyWallet
            width={160}
            height={140}
            color={colors.primary}
            accessible={false}
          />
          <AppText
            testID="summary-empty"
            variant="heading"
            style={styles.emptyTitle}
          >
            {t('summaryEmpty')}
          </AppText>
        </View>
      )}
    </View>
  );
}
