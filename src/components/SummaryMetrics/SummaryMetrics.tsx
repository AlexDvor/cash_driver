import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { SummaryIcon } from '../SummaryIcon/SummaryIcon';
import {
  RetainedCashCardProps,
  SummaryMetricProps,
  SummaryStatCardsProps,
} from './SummaryMetrics.interface';
import { styles } from './SummaryMetrics.styles';

export function RetainedCashCard({
  label,
  amount,
  countLabel,
}: RetainedCashCardProps) {
  const { colors } = useAppTheme();
  const textColor = { color: colors.onPrimary };
  return (
    <Card
      style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
    >
      <AppText variant="heading" style={textColor}>
        {label}
      </AppText>
      <View style={styles.heroRow}>
        <AppText testID="summary-retained" style={[styles.money, textColor]}>
          {amount.replace(/\u00a0(?=EUR\b)/u, ' ')}
        </AppText>
        <SummaryIcon name="coins" color={colors.onPrimary} />
      </View>
      <AppText testID="summary-count" style={textColor}>
        {countLabel}
      </AppText>
    </Card>
  );
}

export function SummaryStatCards({
  fareLabel,
  fareAmount,
  tipLabel,
  tipAmount,
}: SummaryStatCardsProps) {
  const { colors } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const availableWidth = measuredWidth || Math.max(0, width - spacing.xl * 2);
  // Reserve readable icon/value space, then stack instead of shrinking text.
  const minimumWidth = (sizing.touchTarget * 3 + spacing.xxxl) * fontScale;
  const twoColumns = availableWidth >= minimumWidth * 2 + spacing.lg;
  const cardWidth = twoColumns
    ? Math.floor((availableWidth - spacing.lg) / 2)
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
    },
  ];
  return (
    <View
      style={styles.statCards}
      onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}
    >
      {metrics.map(metric => (
        <Card
          key={metric.testID}
          style={[styles.statCard, { width: cardWidth }]}
        >
          <View style={styles.statContent}>
            <View
              style={[styles.iconBadge, { backgroundColor: colors.softGreen }]}
            >
              <SummaryIcon name={metric.icon} color={colors.primary} />
            </View>
            <View style={styles.statText}>
              <AppText variant="supporting" secondary>
                {metric.label}
              </AppText>
              <AppText testID={metric.testID} style={styles.statAmount}>
                {metric.amount}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

export function SummaryMetric({
  label,
  amount,
  testID,
  icon,
}: SummaryMetricProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        {icon && (
          <View
            style={[styles.iconBadge, { backgroundColor: colors.softGreen }]}
          >
            <SummaryIcon name={icon} color={colors.primary} />
          </View>
        )}
        <AppText secondary style={styles.label}>
          {label}
        </AppText>
      </View>
      <AppText testID={testID} style={styles.value}>
        {amount}
      </AppText>
    </View>
  );
}
