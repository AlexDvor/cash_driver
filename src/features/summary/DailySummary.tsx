import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { AppText } from '../../components/AppText';
import { useTranslation } from '../../i18n/LanguageProvider';
import { formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../theme/ThemeProvider';
import { radii, spacing } from '../../theme/tokens';
import { useDailySummary } from './useDailySummary';

export function DailySummary({
  daily,
}: {
  daily: ReturnType<typeof useDailySummary>;
}) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const state = daily.state;
  return (
    <View style={[styles.container, { backgroundColor: colors.softGreen }]}>
      <AppText variant="heading">{t('today')}</AppText>
      {state.status === 'loading' ? (
        <ActivityIndicator
          accessibilityLabel={t('totalsLoading')}
          color={colors.primary}
        />
      ) : state.status === 'error' ? (
        <>
          <AppText
            accessibilityRole="alert"
            style={{ color: colors.errorText }}
          >
            {t('totalsFailed')}
          </AppText>
          <ActionButton label={t('retry')} onPress={daily.refresh} />
        </>
      ) : (
        <>
          <AppText testID="daily-count">
            {t('operationCount')}: {state.summary.operationCount}
          </AppText>
          <View style={styles.totals}>
            {(
              [
                { label: 'fareTotal', cents: state.summary.fareTotalCents },
                { label: 'tipsTotal', cents: state.summary.tipTotalCents },
                {
                  label: 'retainedCash',
                  cents: state.summary.netCashTotalCents,
                },
              ] as const
            ).map(item => (
              <View key={item.label} style={styles.total}>
                <AppText variant="supporting">{t(item.label)}</AppText>
                <AppText testID={item.label} style={styles.value}>
                  {formatMoney(item.cents, locale)}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    borderRadius: radii.input,
    padding: spacing.lg,
    gap: spacing.md,
  },
  totals: { gap: spacing.sm },
  total: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
