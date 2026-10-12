import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import { Platform } from '../../features/transactions/types';
import { platformLabels } from '../../constants/platforms';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { styles } from './PlatformSummaryRow.styles';

const brandImages: Partial<Record<Platform, ImageSourcePropType>> = {
  uber: require('../../assets/brands/uber.png'),
  cabify: require('../../assets/brands/cabify.png'),
  bolt: require('../../assets/brands/bolt.png'),
};

export function PlatformSummaryRow({
  platform,
  amount,
}: {
  platform: Platform;
  amount: string;
}) {
  const { colors } = useAppTheme();
  const image = brandImages[platform];
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        {image && (
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.brandBadge,
              {
                backgroundColor: colors.brandSurface,
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              source={image}
              resizeMode="contain"
              style={styles.brandImage}
              accessible={false}
            />
          </View>
        )}
        <AppText style={styles.label}>{platformLabels[platform]}</AppText>
      </View>
      <AppText testID={`summary-${platform}`} style={styles.value}>
        {amount}
      </AppText>
    </View>
  );
}
