import React from 'react';
import { View } from 'react-native';
import { Platform } from '../../features/transactions/types';
import { platformLabels } from '../../constants/platforms';
import { PlatformIcon } from '../PlatformIcon/PlatformIcon';
import { AppText } from '../../ui/AppText/AppText';
import { styles } from './PlatformSummaryRow.styles';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

export function PlatformSummaryRow({
  platform,
  amount,
  divided = false,
}: {
  platform: Platform;
  amount: string;
  divided?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      {divided && (
        <View
          accessible={false}
          style={[styles.divider, { backgroundColor: colors.border }]}
        />
      )}
      <View style={styles.labelRow}>
        <View style={styles.iconSlot}>
          <PlatformIcon platform={platform} size={24} />
        </View>
        <AppText style={styles.label}>{platformLabels[platform]}</AppText>
      </View>
      <AppText testID={`summary-${platform}`} style={styles.value}>
        {amount}
      </AppText>
    </View>
  );
}
