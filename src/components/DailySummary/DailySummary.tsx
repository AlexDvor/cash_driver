import React, { useRef } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import type { useDailySummary } from '../../hooks/summary/useDailySummary';
import { CollapsibleContent } from '../CollapsibleContent/CollapsibleContent';
import { styles } from './DailySummary.styles';
import { TabIcon } from '../../ui/TabIcon/TabIcon';
import { routes } from '../../navigation/routes';
import { DailySummarySkeleton } from './DailySummarySkeleton';

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
  const summary = state.summary ?? daily.retainedSummary;
  const readyHeight = useRef(0);
  const currentSummary = useRef(summary);
  currentSummary.current = summary;
  const hasRefreshFeedback = daily.refreshing || daily.refreshError;
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
        <TabIcon name={routes.Summary} color={colors.primary} />
        <AppText variant="heading" style={styles.headerText}>
          {t('dailySummaryTitle')}
        </AppText>
        <View
          style={styles.toggleCircle}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View
            style={[styles.circleFill, { backgroundColor: colors.primary }]}
          />
          <View
            style={[
              styles.chevron,
              {
                borderColor: colors.text,
                transform: [{ rotate: expanded ? '225deg' : '45deg' }],
              },
            ]}
          />
        </View>
      </Pressable>
      <CollapsibleContent
        expanded={expanded}
        resetCount={resetCount}
        testID="daily-summary-content"
      >
        <View
          style={[
            styles.content,
            state.status === 'loading' &&
              !summary && { minHeight: readyHeight.current },
          ]}
          onLayout={event => {
            if (currentSummary.current)
              readyHeight.current = event.nativeEvent.layout.height;
          }}
        >
          {state.status === 'loading' && !summary ? (
            <DailySummarySkeleton />
          ) : state.status === 'error' && !summary ? (
            <>
              <AppText
                accessibilityRole="alert"
                style={{ color: colors.errorText }}
              >
                {t('totalsFailed')}
              </AppText>
              <ActionButton label={t('retry')} onPress={daily.refresh} />
            </>
          ) : summary ? (
            <>
              <AppText testID="daily-count" secondary variant="supporting">
                {t('operationCount')}: {summary.operationCount}
              </AppText>
              <View style={styles.totals}>
                {(
                  [
                    { label: 'fareTotal', cents: summary.fareTotalCents },
                    { label: 'tipsTotal', cents: summary.tipTotalCents },
                    {
                      label: 'retainedCash',
                      cents: summary.netCashTotalCents,
                    },
                  ] as const
                ).map(item => (
                  <View
                    key={item.label}
                    style={[
                      styles.total,
                      item.label === 'retainedCash' && [
                        styles.retainedRow,
                        { borderTopColor: colors.border },
                      ],
                    ]}
                  >
                    <AppText
                      variant="supporting"
                      style={
                        item.label === 'retainedCash'
                          ? styles.retainedLabel
                          : undefined
                      }
                    >
                      {t(item.label)}
                    </AppText>
                    <AppText
                      testID={item.label}
                      style={[
                        styles.value,
                        item.label === 'retainedCash' && [
                          styles.retainedValue,
                          { color: colors.primary },
                        ],
                      ]}
                    >
                      {formatMoney(item.cents, locale)}
                    </AppText>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          {/* Reserve normal feedback below totals, so updates do not move their rows. */}
          <View
            pointerEvents={hasRefreshFeedback ? 'auto' : 'none'}
            accessibilityElementsHidden={!hasRefreshFeedback}
            importantForAccessibility={
              hasRefreshFeedback ? 'auto' : 'no-hide-descendants'
            }
            style={[
              styles.refreshFeedback,
              !hasRefreshFeedback && styles.hiddenFeedback,
            ]}
          >
            <View style={styles.refreshStatus}>
              <View style={styles.progressSlot}>
                {daily.refreshing && (
                  <ActivityIndicator color={colors.primary} />
                )}
              </View>
              <AppText
                style={styles.refreshText}
                variant="supporting"
                accessibilityLiveRegion="polite"
                secondary
              >
                {t(daily.refreshError ? 'dataRefreshFailed' : 'dataRefreshing')}
              </AppText>
            </View>
            {daily.refreshError && (
              <ActionButton label={t('retry')} onPress={daily.refresh} />
            )}
          </View>
        </View>
      </CollapsibleContent>
    </View>
  );
}
