import { iconSizing } from '../../constants/theme/tokens';
import React from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import { styles } from './SummaryIcon.styles';

export type SummaryIconName = 'coins' | 'car' | 'gift';

const images: Record<SummaryIconName, ImageSourcePropType> = {
  coins: require('../../assets/summary/coins-3d.png'),
  car: require('../../assets/summary/car-3d.png'),
  gift: require('../../assets/summary/gift-3d.png'),
};

export function SummaryIcon({
  name,
  size = iconSizing.summary,
}: {
  name: SummaryIconName;
  size?: number;
}) {
  return (
    <Image
      testID={`summary-icon-${name}`}
      source={images[name]}
      resizeMode="contain"
      style={[styles.frame, { width: size, height: size }]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
