import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../AppText/AppText';
import { mixColor } from './mixColor';
import { styles } from './MiniBarChart.styles';

export interface MiniBarChartProps {
  values: readonly number[];
  todayIndex: number;
  startLabel: string;
  endLabel: string;
}

// Decorative per-day bars. Today is full accent, past days with cash are a
// soft accent, empty days are a thin line. All fills are opaque.
export function MiniBarChart({
  values,
  todayIndex,
  startLabel,
  endLabel,
}: MiniBarChartProps) {
  const { colors } = useAppTheme();
  const max = Math.max(...values, 0);
  const soft = mixColor(colors.accentFill, colors.card, 0.38);
  return (
    <View
      testID="summary-chart"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.root}
    >
      <View style={styles.bars}>
        {values.map((value, index) => {
          const today = index === todayIndex;
          const empty = value <= 0 || max <= 0;
          return (
            <View key={index} style={styles.slot}>
              <View
                style={[
                  styles.bar,
                  empty
                    ? styles.line
                    : { height: `${Math.max(8, (value / max) * 100)}%` },
                  {
                    backgroundColor: today
                      ? colors.accentFill
                      : empty
                      ? colors.borderStrong
                      : soft,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.axis}>
        <AppText variant="supporting" secondary style={styles.axisLabel}>
          {startLabel}
        </AppText>
        <AppText
          variant="supporting"
          secondary
          style={[styles.axisLabel, styles.axisEnd]}
        >
          {endLabel}
        </AppText>
      </View>
    </View>
  );
}
