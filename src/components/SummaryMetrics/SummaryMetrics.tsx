import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { SkeletonText } from '../../ui/Skeleton/SkeletonText';

export function RetainedCashCard({
  label,
  amount,
  countLabel,
  periodLabel,
  loading = false,
}: RetainedCashCardProps) {
  const { colors } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [contentWidth, setContentWidth] = useState(0);
  const availableWidth =
    contentWidth ||
    Math.max(
      0,
      Math.min(
        sizing.contentMaxWidth,
        width - spacing.xl * 2 - insets.left - insets.right,
      ) -
        spacing.lg * 2 -
        sizing.borderWidth * 2,
    );
  const coinSize = 80;
  const textWidth = availableWidth - coinSize - spacing.lg;
  // Reserve full-size money text before placing the artwork beside it.
  const sideBySide =
    textWidth >=
    Math.max(sizing.touchTarget * 3, amount.length * 34) * fontScale;
  const textColor = { color: colors.onPrimary };
  const money = (
    <SkeletonText
      loading={loading}
      testID="summary-retained"
      style={[styles.money, textColor]}
      sizingText={amount}
    />
  );
  const count = (
    <SkeletonText
      loading={loading}
      testID="summary-count"
      style={textColor}
      sizingText={countLabel}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
    />
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
        style={[styles.heroRow, !sideBySide && styles.heroStack]}
        onLayout={event => setContentWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.heroText}>
          <AppText variant="heading" style={textColor}>
            {label}
          </AppText>
          {periodLabel && (
            <AppText variant="supporting" style={textColor}>
              {periodLabel}
            </AppText>
          )}
          <ScrollView horizontal>{money}</ScrollView>
        </View>
        {sideBySide && (
          <View style={[styles.heroIllustration, { width: coinSize }]}>
            <SummaryIcon name="coins" size={coinSize} />
          </View>
        )}
      </View>
      {sideBySide ? (
        count
      ) : (
        <View style={styles.heroFooter}>
          <View style={styles.heroCount}>{count}</View>
          <SummaryIcon name="coins" size={coinSize} />
        </View>
      )}
    </Card>
  );
}

export function SummaryStatCards({
  fareLabel,
  fareAmount,
  tipLabel,
  tipAmount,
  loading = false,
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
              <SummaryIcon name={metric.icon} size={32} />
            </View>
            <View style={styles.statText}>
              <AppText variant="supporting" secondary>
                {metric.label}
              </AppText>
            </View>
          </View>
          <ScrollView horizontal>
            <SkeletonText
              loading={loading}
              testID={metric.testID}
              style={styles.statAmount}
              sizingText={metric.amount}
            />
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
  loading = false,
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
      <SkeletonText
        loading={loading}
        testID={testID}
        style={styles.value}
        sizingText={amount}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.25}
      />
    </View>
  );
}
