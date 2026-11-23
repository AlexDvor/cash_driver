import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { sizing } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './IconPlate.styles';

const GRADIENT_ID = 'iconPlateGradient';

// Solid duotone icon on a glassy plate: soft gradient, hairline accent border
// and, for the key money icon only, a subtle accent glow.
// Decorative: hidden from accessibility (the adjacent text carries the meaning).
export function IconPlate({
  icon: Icon,
  size = sizing.iconPlate,
  tone = 'accent',
  glow = false,
  testID,
}: {
  icon: React.ComponentType<SvgProps>;
  size?: number;
  tone?: 'accent' | 'danger';
  glow?: boolean;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  const iconSize = Math.round(size * 0.62);
  const danger = tone === 'danger';
  return (
    <View
      testID={testID}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.plate,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          backgroundColor: danger ? colors.card : colors.plateEnd,
          borderColor: danger ? colors.border : colors.plateBorder,
        },
        glow && !danger && { shadowColor: colors.plateGlow, ...styles.glow },
      ]}
    >
      {!danger && (
        <View style={[styles.clip, { borderRadius: Math.round(size * 0.3) }]}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0.4" y2="1">
                <Stop offset="0" stopColor={colors.plateStart} />
                <Stop offset="1" stopColor={colors.plateEnd} />
              </LinearGradient>
            </Defs>
            <Rect width={size} height={size} fill={`url(#${GRADIENT_ID})`} />
          </Svg>
        </View>
      )}
      <Icon
        width={iconSize}
        height={iconSize}
        color={danger ? colors.errorText : colors.primary}
      />
    </View>
  );
}
