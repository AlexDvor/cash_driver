import { iconSizing } from '../../constants/theme/tokens';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { Skeleton } from '../../ui/Skeleton/Skeleton';
import { SkeletonText } from '../../ui/Skeleton/SkeletonText';
import { LoadingSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { styles } from './HistorySkeleton.styles';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

export function HistorySkeleton() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <LoadingSkeleton label={t('operationsLoading')} style={styles.container}>
      <View style={styles.groupHeading}>
        <SkeletonText variant="heading" />
      </View>
      <View style={styles.rows}>
        {[0, 1, 2].map(row => (
          <View
            key={row}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.row}>
              <Skeleton
                width={iconSizing.historyPlatform}
                height={iconSizing.historyPlatform}
              />
              <View style={styles.details}>
                <SkeletonText variant="heading" />
                <SkeletonText variant="supporting" />
              </View>
              <SkeletonText variant="heading" />
            </View>
          </View>
        ))}
      </View>
    </LoadingSkeleton>
  );
}
