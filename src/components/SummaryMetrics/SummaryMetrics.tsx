import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
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
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const coinSize = contentWidth > 0 ? Math.min(144, contentWidth * 0.4) : 44;
  const sideBySide =
    contentWidth * 0.6 - spacing.lg >= sizing.touchTarget * 3 * fontScale;
  const textColor = { color: colors.onPrimary };
  const money = (
    <ScrollView key={amount} horizontal>
      <AppText testID="summary-retained" style={[styles.money, textColor]}>
        {amount}
      </AppText>
    </ScrollView>
  );
  const count = (
    <AppText testID="summary-count" style={textColor}>
      {countLabel}
    </AppText>
  );
  return (
    <Card
      style={[
        styles.heroCard,
        { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.heroBackdrop}
      />
      <View
        style={styles.heroRow}
        onLayout={event => setContentWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.heroText}>
          <AppText variant="heading" style={textColor}>
            {label}
          </AppText>
          {sideBySide && money}
          {sideBySide && count}
        </View>
        <View style={[styles.heroIllustration, { width: coinSize }]}>
          <SummaryIcon name="coins" size={coinSize} />
        </View>
      </View>
      {!sideBySide && money}
      {!sideBySide && count}
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
              <SummaryIcon name={metric.icon} />
            </View>
            <View style={styles.statText}>
              <AppText variant="supporting" secondary>
                {metric.label}
              </AppText>
            </View>
          </View>
          <ScrollView key={metric.amount} horizontal>
            <AppText testID={metric.testID} style={styles.statAmount}>
              {metric.amount}
            </AppText>
          </ScrollView>
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
            <SummaryIcon name={icon} />
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
