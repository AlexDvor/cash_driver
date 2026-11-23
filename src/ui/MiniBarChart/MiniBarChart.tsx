import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useMotionPreference } from '../../hooks/app/useMotionPreference';
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
  const { colors, appearance } = useAppTheme();
  const max = Math.max(...values, 0);
  // Bars grow from the baseline, left to right. With Reduce Motion they are
  // simply drawn; until the preference is known they stay collapsed (no flash).
  const motion = useMotionPreference();
  const progress = useRef(new Animated.Value(0)).current;
  const signature = values.join(',');
  useEffect(() => {
    if (motion === 'pending') return;
    if (motion === 'reduced') {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [signature, motion, progress]);
  const scales = useMemo(
    () =>
      values.map((_, index) => {
        const start = (index / Math.max(values.length, 1)) * 0.4;
        return progress.interpolate({
          inputRange: [start, start + 0.6],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature, progress],
  );
  const soft = mixColor(
    colors.indicator,
    colors.card,
    // A pale olive on white needs more weight than lime on near-black.
    appearance === 'dark' ? 0.38 : 0.6,
  );
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
              <Animated.View
                style={[
                  styles.bar,
                  empty
                    ? styles.line
                    : { height: `${Math.max(8, (value / max) * 100)}%` },
                  {
                    backgroundColor: today
                      ? colors.indicator
                      : empty
                      ? colors.borderStrong
                      : soft,
                    transform: [{ scaleY: scales[index] }],
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
