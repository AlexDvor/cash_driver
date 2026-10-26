import React, { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { surfaceDepth } from '../../constants/theme/tokens';

// Decorative overlay only: the parent keeps its layout, base color and controls.
export function SurfaceDepth({
  radius,
  action = false,
}: {
  radius: number;
  action?: boolean;
}) {
  const { colors } = useAppTheme();
  const id = `depth${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const tint = action ? colors.text : colors.primary;
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
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
          <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop
              offset="0"
              stopColor={tint}
              stopOpacity={surfaceDepth.leadingOpacity}
            />
            <Stop offset="0.6" stopColor={tint} stopOpacity={0} />
            <Stop
              offset="1"
              stopColor={tint}
              stopOpacity={surfaceDepth.trailingOpacity}
            />
          </LinearGradient>
        </Defs>
        <Rect
          width={size.width}
          height={size.height}
          rx={radius}
          fill={`url(#${id})`}
        />
      </Svg>
    </View>
  );
}
