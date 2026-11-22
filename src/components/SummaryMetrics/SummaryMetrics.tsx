import { summaryLayout } from '../../constants/theme/layout';
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
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

// Duotone icon on a soft accent plate. Decorative, hidden from accessibility.
function IconPlate({
  name,
  size,
  testID,
}: {
  name: SummaryIconName | 'coins';
  size: number;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  const Icon = icons[name];
  const iconSize = Math.round(size * 0.55);
  return (
    <View
      testID={testID ?? `summary-icon-${name}`}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.plate,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          backgroundColor: colors.softGreen,
        },
      ]}
    >
      <Icon width={iconSize} height={iconSize} color={colors.primary} />
    </View>
  );
}

export function RetainedCashCard({
  label,
  amount,
  countLabel,
  chart,
}: RetainedCashCardProps) {
  const money = (
    <AppText testID="summary-retained" style={styles.money}>
      {amount || ' '}
    </AppText>
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
        <IconPlate name="coins" size={52} />
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
            <IconPlate name={metric.icon} size={sizing.iconPlate} />
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
      {icon && <IconPlate name={icon} size={sizing.iconPlate} />}
    </View>
  );
}
