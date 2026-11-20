import { summaryLayout } from '../../constants/theme/layout';
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
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
import { SummaryHeroBackground } from './SummaryHeroBackground';

export function RetainedCashCard({
  label,
  amount,
  countLabel,
}: RetainedCashCardProps) {
  const { colors, appearance } = useAppTheme();
  const coinSize = iconSizing.summaryHero;
  const textColor = {
    color: appearance === 'dark' ? colors.text : colors.onPrimary,
  };
  const money = (
    <AppText
      testID="summary-retained"
      style={[
        styles.money,
        { color: appearance === 'dark' ? colors.primary : colors.onPrimary },
      ]}
    >
      {amount || ' '}
    </AppText>
  );
  const count = (
    <AppText
      testID="summary-count"
      style={textColor}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={summaryLayout.countMinimumFontScale}
    >
      {countLabel || ' '}
    </AppText>
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
      <View style={styles.heroRow}>
        <View style={styles.heroText}>
          <AppText style={[styles.heroLabel, textColor]}>{label}</AppText>
          <ScrollView horizontal>{money}</ScrollView>
          {count}
        </View>
        <View style={[styles.heroIllustration, { width: coinSize }]}>
          <SummaryIcon name="coins" size={coinSize} />
        </View>
      </View>
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
    },
  ];
  return (
    <View
      style={styles.statCards}
      onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}
    >
      {metrics.map(metric => {
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
              <View style={styles.statIllustration}>
                <SummaryIcon
                  name={metric.icon}
                  size={iconSizing.summaryMetric}
                />
              </View>
            </View>
            <ScrollView horizontal style={styles.statAmountScroll}>
              <AppText testID={metric.testID} style={styles.statAmount}>
                {metric.amount || ' '}
              </AppText>
            </ScrollView>
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
}: SummaryMetricProps) {
  return (
    <View style={styles.row}>
      <View style={styles.statText}>
        <AppText variant="supporting">{label}</AppText>
        <ScrollView horizontal>
          <AppText testID={testID} style={styles.statAmount}>
            {amount || ' '}
          </AppText>
        </ScrollView>
      </View>
      {icon && <SummaryIcon name={icon} size={iconSizing.summaryMetric} />}
    </View>
  );
}
