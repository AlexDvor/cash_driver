import React from 'react';
import { View } from 'react-native';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { SkeletonText } from '../../ui/Skeleton/SkeletonText';
import { AppText } from '../../ui/AppText/AppText';
import { LoadingSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { styles } from './DailySummary.styles';

export function DailySummarySkeleton() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <LoadingSkeleton label={t('totalsLoading')}>
      <SkeletonText
        variant="supporting"
        sizingText={`${t('operationCount')}: —`}
      />
      <View style={styles.totals}>
        {(['fareTotal', 'tipsTotal', 'retainedCash'] as const).map(row => (
          <View
            key={row}
            style={[
              styles.total,
              row === 'retainedCash' && [
                styles.retainedRow,
                { borderTopColor: colors.border },
              ],
            ]}
          >
            <AppText
              variant="supporting"
              style={row === 'retainedCash' ? styles.retainedLabel : undefined}
            >
              {t(row)}
            </AppText>
            <SkeletonText
              style={[
                styles.value,
                row === 'retainedCash' && styles.retainedValue,
              ]}
            />
          </View>
        ))}
      </View>
    </LoadingSkeleton>
  );
}
