import { summaryLayout } from '../../constants/theme/layout';
import { sizing } from '../../constants/theme/tokens';
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
  share = 0,
  divided = false,
}: {
  platform: Platform;
  amount: string;
  // Whole percent of the period's fare total, 0-100.
  share?: number;
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
      <View style={styles.main}>
        <View style={styles.labelRow}>
          <View style={styles.iconSlot}>
            <PlatformIcon platform={platform} size={sizing.icon} />
          </View>
          <AppText style={styles.label}>{platformLabels[platform]}</AppText>
        </View>
        <View style={styles.valueColumn}>
          <AppText
            testID={`summary-${platform}`}
            style={styles.value}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={summaryLayout.labelMinimumFontScale}
          >
            {amount || ' '}
          </AppText>
          <AppText
            testID={`summary-${platform}-share`}
            variant="supporting"
            secondary
            style={styles.percent}
            numberOfLines={1}
          >
            {amount ? `${share}%` : ' '}
          </AppText>
        </View>
      </View>
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[styles.track, { backgroundColor: colors.border }]}
      >
        <View
          style={[
            styles.fill,
            { width: `${share}%`, backgroundColor: colors.accentFill },
          ]}
        />
      </View>
    </View>
  );
}
