import React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { sizing } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './IconPlate.styles';

// Duotone icon on a soft plate; the one look used for every metric/heading icon.
// Decorative: hidden from accessibility (the adjacent text carries the meaning).
export function IconPlate({
  icon: Icon,
  size = sizing.iconPlate,
  tone = 'accent',
  testID,
}: {
  icon: React.ComponentType<SvgProps>;
  size?: number;
  tone?: 'accent' | 'danger';
  testID?: string;
}) {
  const { colors } = useAppTheme();
  const iconSize = Math.round(size * 0.62);
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
          backgroundColor: tone === 'danger' ? colors.card : colors.softGreen,
        },
      ]}
    >
      <Icon
        width={iconSize}
        height={iconSize}
        color={tone === 'danger' ? colors.errorText : colors.primary}
      />
    </View>
  );
}
