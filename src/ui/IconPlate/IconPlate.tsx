import React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { sizing } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { GradientFill } from '../GradientFill/GradientFill';
import { styles } from './IconPlate.styles';

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
      ]}
    >
      {glow && !danger && (
        <View
          pointerEvents="none"
          style={[
            styles.glowHalo,
            {
              borderRadius: Math.round(size * 0.3) + 5,
              backgroundColor: colors.plateGlow,
            },
          ]}
        />
      )}
      {!danger && (
        <GradientFill
          id="iconPlateGradient"
          from={colors.plateStart}
          to={colors.plateEnd}
          radius={Math.round(size * 0.3)}
        />
      )}
      <Icon
        width={iconSize}
        height={iconSize}
        color={danger ? colors.errorText : colors.primary}
      />
    </View>
  );
}
