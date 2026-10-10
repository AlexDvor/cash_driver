import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import type { useDailySummary } from '../../hooks/summary/useDailySummary';
import { CollapsibleContent } from '../CollapsibleContent/CollapsibleContent';
import { styles } from './DailySummary.styles';

export function DailySummary({
  daily,
  expanded,
  resetCount,
  onToggle,
}: {
  daily: ReturnType<typeof useDailySummary>;
  expanded: boolean;
  resetCount: number;
  onToggle: () => void;
}) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const state = daily.state;
  const toggleLabel = `${t('today')} · ${t(
    expanded ? 'hideTotals' : 'showTotals',
  )}`;
  return (
    <View style={[styles.container, { backgroundColor: colors.softGreen }]}>
      <Pressable
        testID="daily-summary-toggle"
        accessibilityRole="button"
        accessibilityLabel={toggleLabel}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <AppText variant="heading" style={styles.headerText}>
          {toggleLabel}
        </AppText>
        <AppText accessible={false}>{expanded ? '▴' : '▾'}</AppText>
      </Pressable>
      <CollapsibleContent
        expanded={expanded}
        resetCount={resetCount}
        testID="daily-summary-content"
      >
        <View style={styles.content}>
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
      </CollapsibleContent>
    </View>
  );
}
