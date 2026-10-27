import { iconSizing } from '../../constants/theme/tokens';
import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import type { Platform } from '../../constants/platforms';
import { styles } from './PlatformIcon.styles';

const images: Record<Platform, ImageSourcePropType> = {
  uber: require('../../assets/brands/uber-app.jpg'),
  cabify: require('../../assets/brands/cabify-app.jpg'),
  bolt: require('../../assets/brands/bolt-app.jpg'),
  other: require('../../assets/brands/taxi-option-1.png'),
};

export function PlatformIcon({
  platform,
  size = iconSizing.platform,
}: {
  platform: Platform;
  size?: number;
}) {
  return (
    <Image
      testID={`platform-icon-${platform}`}
      source={images[platform]}
      resizeMode="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.icon,
        { width: size, height: size, borderRadius: size / 4 },
      ]}
    />
  );
}
