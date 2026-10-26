import React, { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { radii, summaryHeroLighting } from '../../constants/theme/tokens';
import { styles } from './SummaryMetrics.styles';

export function SummaryHeroBackground() {
  const { colors, appearance } = useAppTheme();
  const id = `summary${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      style={styles.heroBackdrop}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      <Svg width={size.width} height={size.height}>
        <Defs>
          <LinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0" stopColor={colors.summaryHeroStart} />
            <Stop offset="1" stopColor={colors.summaryHeroEnd} />
          </LinearGradient>
          <RadialGradient
            id={`${id}glow`}
            cx="100%"
            cy="0%"
            rx="100%"
            ry="210%"
            fx="100%"
            fy="0%"
          >
            <Stop
              offset="0"
              stopColor={colors.summaryHeroGlow}
              stopOpacity={
                appearance === 'dark'
                  ? summaryHeroLighting.darkOpacity
                  : summaryHeroLighting.lightOpacity
              }
            />
            <Stop
              offset="1"
              stopColor={colors.summaryHeroGlow}
              stopOpacity={0}
            />
          </RadialGradient>
        </Defs>
        <Rect
          width={size.width}
          height={size.height}
          rx={radii.card}
          fill={`url(#${id})`}
        />
        <Rect
          width={size.width}
          height={size.height}
          rx={radii.card}
          fill={`url(#${id}glow)`}
        />
      </Svg>
    </View>
  );
}
