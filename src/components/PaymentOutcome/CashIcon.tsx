import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { sizing } from '../../constants/theme/tokens';

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
