import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import type { Platform } from '../../constants/platforms';
import { styles } from './PlatformIcon.styles';

const images: Record<Exclude<Platform, 'other'>, ImageSourcePropType> = {
  uber: require('../../assets/brands/uber-app.jpg'),
  cabify: require('../../assets/brands/cabify-app.jpg'),
  bolt: require('../../assets/brands/bolt-app.jpg'),
};

export function PlatformIcon({
  platform,
  size = 28,
}: {
  platform: Platform;
  size?: 24 | 28 | 44 | 60;
}) {
  if (platform === 'other') {
    return null;
  }
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
