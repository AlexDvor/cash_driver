import { summaryLayout } from '../../constants/theme/layout';
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sizing, spacing, iconSizing } from '../../constants/theme/tokens';
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
import { SummaryHeroBackground } from './SummaryHeroBackground';

export function RetainedCashCard({
  label,
  amount,
  countLabel,
  loading = false,
}: RetainedCashCardProps) {
  const { colors, appearance } = useAppTheme();
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
  const coinSize = iconSizing.summaryHero;
  const textWidth = availableWidth - coinSize - spacing.lg;
  // Reserve full-size money text before placing the artwork beside it.
  const sideBySide =
    textWidth >=
    Math.max(
      sizing.touchTarget * 3,
      amount.length * summaryLayout.moneyCharacterWidth,
    ) *
      fontScale;
  const textColor = {
    color: appearance === 'dark' ? colors.text : colors.onPrimary,
  };
  const money = (
    <SkeletonText
      loading={loading}
      testID="summary-retained"
      style={[
        styles.money,
        { color: appearance === 'dark' ? colors.primary : colors.onPrimary },
      ]}
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
      minimumFontScale={summaryLayout.countMinimumFontScale}
    />
  );
  return (
    <Card
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.summaryHeroStart,
          borderColor: colors.summaryHeroStart,
        },
      ]}
    >
      <SummaryHeroBackground />
      <View
        style={[styles.heroRow, !sideBySide && styles.heroStack]}
        onLayout={event => setContentWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.heroText}>
          <AppText style={[styles.heroLabel, textColor]}>{label}</AppText>
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
      {metrics.map(metric => {
        const iconBesideAmount =
          cardWidth -
            spacing.md * 2 -
            sizing.borderWidth * 2 -
            iconSizing.summaryMetric -
            spacing.sm >=
          metric.amount.length *
            summaryLayout.statMoneyCharacterWidth *
            fontScale;
        return (
          <Card
            depth
            key={metric.testID}
            style={[styles.statCard, { width: cardWidth }]}
          >
            <View style={styles.statContent}>
              <AppText variant="supporting" style={styles.statText}>
                {metric.label}
              </AppText>
              {!iconBesideAmount && (
                <SummaryIcon
                  name={metric.icon}
                  size={iconSizing.summaryMetric}
                />
              )}
            </View>
            <View style={styles.statContent}>
              <View style={styles.statText}>
                <ScrollView horizontal>
                  <SkeletonText
                    loading={loading}
                    testID={metric.testID}
                    style={styles.statAmount}
                    sizingText={metric.amount}
                  />
                </ScrollView>
              </View>
              {iconBesideAmount && (
                <SummaryIcon
                  name={metric.icon}
                  size={iconSizing.summaryMetric}
                />
              )}
            </View>
          </Card>
        );
      })}
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
  return (
    <View style={styles.row}>
      <View style={styles.statText}>
        <AppText variant="supporting">{label}</AppText>
        <ScrollView horizontal>
          <SkeletonText
            loading={loading}
            testID={testID}
            style={styles.statAmount}
            sizingText={amount}
          />
        </ScrollView>
      </View>
      {icon && <SummaryIcon name={icon} size={iconSizing.summaryMetric} />}
    </View>
  );
}
