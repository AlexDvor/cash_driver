import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { spacing, sizing } from '../../constants/theme/tokens';

// The outline follows the measured content; it never scales or rasterizes text.
export function ReceiptSurface({
  width,
  height,
  dividerY,
  fill,
}: {
  width: number;
  height: number;
  dividerY: number;
  fill: string;
}) {
  const { colors } = useAppTheme();
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (width <= 0 || height <= 0) return null;
  const edge = sizing.borderWidth;
  const corner = spacing.sm;
  const notch = spacing.md;
  const right = width - edge;
  const bottom = height - edge;
  const center = Math.max(
    corner + notch,
    Math.min(height - corner - notch, dividerY || height * 0.6),
  );
  function side(x: number, from: number, to: number, direction: number) {
    const inward = x === edge ? spacing.xs : -spacing.xs;
    let path = '';
    for (
      let y = from + direction * spacing.md;
      direction * (to - y) > spacing.sm;
      y += direction * spacing.md
    ) {
      path += ` L ${x} ${y} q ${inward} ${direction * spacing.xs} 0 ${
        direction * spacing.sm
      }`;
    }
    return `${path} L ${x} ${to}`;
  }
  const outline = [
    `M ${edge + corner} ${edge} H ${
      right - corner
    } Q ${right} ${edge} ${right} ${edge + corner}`,
    side(right, edge + corner, center - notch, 1),
    `A ${notch} ${notch} 0 0 0 ${right} ${center + notch}`,
    side(right, center + notch, bottom - corner, 1),
    `Q ${right} ${bottom} ${right - corner} ${bottom} H ${
      edge + corner
    } Q ${edge} ${bottom} ${edge} ${bottom - corner}`,
    side(edge, bottom - corner, center + notch, -1),
    `A ${notch} ${notch} 0 0 0 ${edge} ${center - notch}`,
    side(edge, center - notch, edge + corner, -1),
    `Q ${edge} ${edge} ${edge + corner} ${edge} Z`,
  ].join(' ');
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={fill} />
          <Stop offset="0.45" stopColor={fill} />
          <Stop offset="1" stopColor={colors.card} />
        </LinearGradient>
      </Defs>
      <Path
        d={outline}
        fill={`url(#${gradientId})`}
        stroke={colors.border}
        strokeWidth={edge}
      />
      <Path
        d={outline}
        fill="none"
        stroke={colors.primary}
        strokeOpacity={0.35}
        strokeWidth={edge}
        strokeDasharray="4 6"
      />
    </Svg>
  );
}

export function CashIcon({ color }: { color: string }) {
  return (
    <Svg
      width={sizing.icon}
      height={sizing.icon}
      viewBox="0 0 28 28"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
        <Path d="M6 8 23 4 26 19 22 20" />
        <Rect x={2} y={9} width={21} height={15} rx={1} />
        <Circle cx={12.5} cy={16.5} r={3} />
        <Path d="M2 14a5 5 0 0 0 5-5m11 0a5 5 0 0 0 5 5M2 19a5 5 0 0 1 5 5m11 0a5 5 0 0 1 5-5" />
      </G>
    </Svg>
  );
}
