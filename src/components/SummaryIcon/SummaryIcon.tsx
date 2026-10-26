import { iconSizing } from '../../constants/theme/tokens';
import React from 'react';
import { Image, View } from 'react-native';
import { styles } from './SummaryIcon.styles';
import CarIcon from '../../assets/summary/car-flat.svg';
import GiftIcon from '../../assets/summary/gift-flat.svg';
import AverageIcon from '../../assets/summary/average-bars.svg';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

export type SummaryIconName = 'coins' | 'car' | 'gift' | 'average';

const icons = {
  car: CarIcon,
  gift: GiftIcon,
  average: AverageIcon,
};

export function SummaryIcon({
  name,
  size = iconSizing.summary,
}: {
  name: SummaryIconName;
  size?: number;
}) {
  const { colors, appearance } = useAppTheme();
  const coinImage =
    appearance === 'dark'
      ? require('../../assets/summary/coins-reference-dark.png')
      : require('../../assets/summary/coins-reference-light.png');
  const Icon = name === 'coins' ? null : icons[name];
  return (
    <View
      testID={`summary-icon-${name}`}
      style={[styles.frame, { width: size, height: size }]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Icon ? (
        <Icon width={size} height={size} color={colors.summaryIcon} />
      ) : (
        <Image
          source={coinImage}
          resizeMode="contain"
          style={{ width: size, height: size }}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
    </View>
  );
}
