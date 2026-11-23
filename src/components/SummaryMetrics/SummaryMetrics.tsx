import { summaryLayout } from '../../constants/theme/layout';
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { mixColor } from '../../ui/MiniBarChart/mixColor';
import { useCountUp } from '../../hooks/app/useCountUp';
import { useMotionPreference } from '../../hooks/app/useMotionPreference';
import { IconPlate } from '../../ui/IconPlate/IconPlate';
import { MiniBarChart } from '../../ui/MiniBarChart/MiniBarChart';
import { chartHeight } from '../../ui/MiniBarChart/MiniBarChart.styles';
import CarIcon from '../../assets/icons/duotone/car.svg';
import GiftIcon from '../../assets/icons/duotone/gift.svg';
import BarsIcon from '../../assets/icons/duotone/bars.svg';
import CoinsIcon from '../../assets/icons/duotone/coins.svg';
import {
  RetainedCashCardProps,
  SummaryIconName,
  SummaryMetricProps,
  SummaryStatCardsProps,
} from './SummaryMetrics.interface';
import { styles } from './SummaryMetrics.styles';

const icons = {
  car: CarIcon,
  gift: GiftIcon,
  average: BarsIcon,
  coins: CoinsIcon,
};

// Duotone icon on a soft accent plate (shared look, see ui/IconPlate).
function MetricPlate({ name, size }: { name: SummaryIconName; size: number }) {
  return (
    <IconPlate testID={`summary-icon-${name}`} icon={icons[name]} size={size} />
  );
}

// Hero icon: coins on a round plate with a dashed halo, echoing the empty-state art.
function CoinMedallion({ size }: { size: number }) {
  const { colors } = useAppTheme();
  const inner = size - 10;
  return (
    <View
      testID="summary-icon-coins"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.medallionHalo,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: mixColor(colors.indicator, colors.card, 0.5),
        },
      ]}
    >
      <View
        style={[
          styles.medallionCore,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: colors.softGreen,
          },
        ]}
      >
        <CoinsIcon
          width={Math.round(inner * 0.76)}
          height={Math.round(inner * 0.76)}
          color={colors.primary}
        />
      </View>
    </View>
  );
}

export function RetainedCashCard({
  label,
  amount,
  countLabel,
  chart,
  amountCents = null,
  formatAmount,
}: RetainedCashCardProps) {
  const motion = useMotionPreference();
  const counting = useCountUp(amountCents, motion === 'full');
  // The real amount stays in place (tests and screen readers read it); while
  // counting, a decorative copy is shown on top and the real one is hidden.
  const money = (
    <View>
      <AppText
        testID="summary-retained"
        style={[styles.money, counting !== null && styles.moneyHidden]}
      >
        {amount || ' '}
      </AppText>
      {counting !== null && formatAmount && (
        <AppText
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          numberOfLines={1}
          style={[styles.money, styles.moneyOverlay]}
        >
          {formatAmount(counting)}
        </AppText>
      )}
    </View>
  );
  const count = (
    <AppText
      testID="summary-count"
      secondary
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={summaryLayout.countMinimumFontScale}
    >
      {countLabel || ' '}
    </AppText>
  );
  return (
    <Card depth style={styles.heroCard}>
      <View style={styles.heroRow}>
        <CoinMedallion size={68} />
        <View style={styles.heroText}>
          <AppText variant="supporting" secondary>
            {label}
          </AppText>
          {count}
        </View>
      </View>
      <ScrollView horizontal>{money}</ScrollView>
      {chart &&
        (chart.loading ? (
          <View style={{ height: chartHeight + spacing.sm + 16 }} />
        ) : (
          <MiniBarChart
            values={chart.values}
            todayIndex={chart.todayIndex}
            startLabel={chart.startLabel}
            endLabel={chart.endLabel}
          />
        ))}
    </Card>
  );
}

export function SummaryStatCards({
  fareLabel,
  fareAmount,
  tipLabel,
  tipAmount,
}: SummaryStatCardsProps) {
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const availableWidth = measuredWidth || Math.max(0, width - spacing.xl * 2);
  // Reserve readable icon/value space, then stack instead of shrinking text.
  const minimumWidth = sizing.touchTarget * 3 * fontScale;
  const twoColumns = availableWidth >= minimumWidth * 2 + spacing.md;
  const cardWidth = twoColumns
    ? Math.floor((availableWidth - spacing.md) / 2)
    : availableWidth;
  const metrics: (SummaryMetricProps & { icon: 'car' | 'gift' })[] = [
    {
      label: fareLabel,
      amount: fareAmount,
      icon: 'car',
      testID: 'summary-fareTotal',
    },
    {
      label: tipLabel,
      amount: tipAmount,
      icon: 'gift',
      testID: 'summary-tipsTotal',
      accent: true,
    },
  ];
  return (
    <View
      style={styles.statCards}
      onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}
    >
      {metrics.map(metric => (
        <Card
          depth
          key={metric.testID}
          style={[styles.statCard, { width: cardWidth }]}
        >
          <View style={styles.statContent}>
            <AppText variant="supporting" secondary style={styles.statText}>
              {metric.label}
            </AppText>
            <MetricPlate name={metric.icon} size={sizing.iconPlate} />
          </View>
          <ScrollView horizontal style={styles.statAmountScroll}>
            <StatAmount testID={metric.testID} accent={metric.accent}>
              {metric.amount}
            </StatAmount>
          </ScrollView>
        </Card>
      ))}
    </View>
  );
}

function StatAmount({
  testID,
  accent,
  children,
}: {
  testID: string;
  accent?: boolean;
  children: string;
}) {
  const { colors } = useAppTheme();
  return (
    <AppText
      testID={testID}
      style={[styles.statAmount, accent && { color: colors.primary }]}
    >
      {children || ' '}
    </AppText>
  );
}

export function SummaryMetric({
  label,
  amount,
  testID,
  icon,
}: SummaryMetricProps) {
  return (
    <View style={styles.row}>
      <View style={styles.statText}>
        <AppText variant="supporting" secondary>
          {label}
        </AppText>
        <ScrollView horizontal>
          <StatAmount testID={testID}>{amount}</StatAmount>
        </ScrollView>
      </View>
      {icon && <MetricPlate name={icon} size={sizing.iconPlate} />}
    </View>
  );
}
