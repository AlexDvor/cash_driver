import { iconSizing } from '../../constants/theme/tokens';
import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import type { Platform } from '../../constants/platforms';
import { styles } from './PlatformIcon.styles';

const images: Record<Exclude<Platform, 'other'>, ImageSourcePropType> = {
  uber: require('../../assets/brands/uber-app.jpg'),
  cabify: require('../../assets/brands/cabify-app.jpg'),
  bolt: require('../../assets/brands/bolt-app.jpg'),
};

export function PlatformIcon({
  platform,
  size = iconSizing.platform,
}: {
  platform: Platform;
  size?: number;
}) {
  if (platform === 'other') {
    return (
      <View
        testID="platform-icon-other"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.other,
          { width: size, height: size, borderRadius: size / 4 },
        ]}
      >
        {[0, 1, 2].map(dot => (
          <View
            key={dot}
            style={[
              styles.dot,
              { width: size / 9, height: size / 9, borderRadius: size / 18 },
            ]}
          />
        ))}
      </View>
    );
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
