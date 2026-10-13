import React from 'react';
import { View } from 'react-native';
import { Platform } from '../../features/transactions/types';
import { platformLabels } from '../../constants/platforms';
import { PlatformIcon } from '../PlatformIcon/PlatformIcon';
import { AppText } from '../../ui/AppText/AppText';
import { styles } from './PlatformSummaryRow.styles';

export function PlatformSummaryRow({
  platform,
  amount,
}: {
  platform: Platform;
  amount: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <PlatformIcon platform={platform} size={24} />
        <AppText style={styles.label}>{platformLabels[platform]}</AppText>
      </View>
      <AppText testID={`summary-${platform}`} style={styles.value}>
        {amount}
      </AppText>
    </View>
  );
}
