import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { routes } from '../../navigation/routes';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { Card } from '../../ui/Card/Card';
import { PlatformIcon } from '../../components/PlatformIcon/PlatformIcon';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatMoney, formatPeriodRange } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import {
  groupHistory,
  HistoryPlatform,
} from '../../features/transactions/history';
import { platforms, platformLabels } from '../../constants/platforms';
import { usePagedTransactions } from '../../hooks/transactions/usePagedTransactions';
import { useHasTransactions } from '../../hooks/transactions/useHasTransactions';
import { useCalendarSelection } from '../../hooks/summary/useCalendarSelection';
import { CalendarNavigation } from '../../components/CalendarNavigation/CalendarNavigation';
import {
  getCalendarDayBounds,
  getPeriodBounds,
  SummaryPeriod,
} from '../../features/summary/periods';
import { spacing, sizing, iconSizing } from '../../constants/theme/tokens';
import { TransactionLoadState } from '../../components/TransactionLoadState/TransactionLoadState';
import { styles } from './HistoryScreen.styles';
import { HistorySkeleton } from '../../components/HistorySkeleton/HistorySkeleton';

function HistorySeparator() {
  return <View style={styles.separator} />;
}

export function HistoryScreen() {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const clock = useLocalClock();
  const insets = useSafeAreaInsets();
  const calendar = useCalendarSelection(clock);
  const cancelCalendar = useRef(calendar.cancelCalendar);
  cancelCalendar.current = calendar.cancelCalendar;
  useFocusEffect(useCallback(() => () => cancelCalendar.current(), []));
  const deletion = useDeletion();
  const [period, setPeriod] = useState<SummaryPeriod>('day');
  const [platform, setPlatform] = useState<HistoryPlatform>('all');
  const bounds = useMemo(() => {
    if (period === 'month') {
      return calendar.bounds;
    }
    const [year, month, day] = clock.dayKey.split('-').map(Number);
    const dayBounds = getCalendarDayBounds(
      { year, month, day },
      clock.timeZone,
    );
    return period === 'day'
      ? dayBounds
      : getPeriodBounds(dayBounds.start, 'week', clock.timeZone);
  }, [period, calendar.bounds, clock.dayKey, clock.timeZone]);
  const filter = useMemo(
    () => ({ bounds, platform: platform === 'all' ? undefined : platform }),
    [bounds, platform],
  );
  const { state, refresh, loadMore } = usePagedTransactions(filter);
  const readyContentHeight = useRef(0);
  const currentStatus = useRef(state.status);
  currentStatus.current = state.status;
  const existence = useHasTransactions();
  const groups = useMemo(
    () =>
      state.records
        ? groupHistory(state.records, 'all', 'all', new Date(0), clock.timeZone)
        : [],
    [state.records, clock.timeZone],
  );
  const sections = useMemo(() => {
    const dateFormat = new Intl.DateTimeFormat(locale, {
      timeZone: clock.timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormat = new Intl.DateTimeFormat(locale, {
      timeZone: clock.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    return groups.map(group => ({
      ...group,
      dateLabel: dateFormat.format(group.date),
      data: group.records.map(record => {
        const timeLabel = timeFormat.format(new Date(record.createdAt));
        const fareLabel = formatMoney(record.fareAmountCents, locale);
        return {
          ...record,
          timeLabel,
          fareLabel,
          tipLabel:
            record.tipCents > 0
              ? t('tipAmount', { amount: formatMoney(record.tipCents, locale) })
              : null,
          openLabel: t('openOperation', {
            platform: platformLabels[record.platform],
            time: timeLabel,
            fare: fareLabel,
          }),
        };
      }),
    }));
  }, [groups, locale, clock.timeZone, t]);
  const empty =
    state.status === 'ready' &&
    state.empty &&
    !state.refreshing &&
    !state.refreshError;
  const header = (
    <View style={styles.controls}>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          {t('history')}
        </AppText>
        <AppText secondary>{t('historySubtitle')}</AppText>
      </View>
      <Card depth style={styles.filterSurface}>
        <ChoiceGroup
          label={t('period')}
          columns="filters"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'day', label: t('today') },
            { value: 'week', label: t('week') },
            { value: 'month', label: t('month') },
          ]}
        />
        {period === 'month' && (
          <CalendarNavigation
            calendar={calendar}
            timeZone={clock.timeZone}
            todayDateKey={clock.dayKey}
          />
        )}
        {period !== 'day' &&
          !(period === 'month' && calendar.selection.kind === 'day') && (
            <AppText secondary testID="history-range">
              {formatPeriodRange(bounds, locale, clock.timeZone)}
            </AppText>
          )}
      </Card>
      <Card depth style={styles.filterSurface}>
        <ChoiceGroup
          label={t('platform')}
          iconLayout="adaptive"
          columns="filters"
          value={platform}
          onChange={setPlatform}
          options={[
            { value: 'all', label: t('allPlatforms') },
            ...platforms.map(value => ({
              value,
              label: platformLabels[value],
              icon: <PlatformIcon platform={value} size={sizing.icon} />,
            })),
          ]}
        />
      </Card>
      {state.status === 'error' && (
        <TransactionLoadState status={state.status} retry={refresh} />
      )}
      {empty && existence.state.status === 'loading' && (
        <ActivityIndicator
          accessibilityLabel={t('operationsLoading')}
          color={colors.primary}
        />
      )}
      {empty && existence.state.status === 'error' && (
        <View style={styles.feedback}>
          <AppText accessibilityRole="alert">
            {t('historyExistenceFailed')}
          </AppText>
          <ActionButton label={t('retry')} onPress={existence.refresh} />
        </View>
      )}
      {empty && existence.state.status === 'ready' && (
        <>
          <AppText>
            {t(
              existence.state.hasAny === false
                ? 'historyEmpty'
                : 'historyFilteredEmpty',
            )}
          </AppText>
          {existence.state.hasAny === false && (
            <ActionButton
              label={t('registerPayment')}
              onPress={() =>
                navigation.navigate(routes.Tabs, { screen: routes.Home })
              }
            />
          )}
        </>
      )}
    </View>
  );
  return (
    <View
      style={[
        styles.fill,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <SectionList
        testID="history-list"
        sections={sections}
        keyExtractor={record => record.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onContentSizeChange={(_width, height) => {
          if (currentStatus.current === 'ready')
            readyContentHeight.current = height;
        }}
        contentContainerStyle={[
          styles.content,
          state.status === 'loading' && {
            minHeight: readyContentHeight.current,
          },
          {
            paddingTop: spacing.xl,
            paddingBottom: spacing.xl,
            paddingLeft: spacing.xl + insets.left,
            paddingRight: spacing.xl + insets.right,
          },
        ]}
        ListHeaderComponent={header}
        ItemSeparatorComponent={HistorySeparator}
        renderSectionHeader={({ section: group }) => (
          <View style={styles.groupHeading}>
            <AppText variant="heading" accessibilityRole="header">
              {clock.dayKey === group.key ? `${t('today')} · ` : ''}
              {group.dateLabel}
            </AppText>
          </View>
        )}
        renderItem={({ item: record }) => {
          return (
            <Pressable
              testID={`history-${record.id}`}
              accessibilityRole="button"
              accessibilityLabel={[
                record.openLabel,
                record.tipLabel,
                deletion.state.id === record.id ? t('deletionPending') : null,
              ]
                .filter(Boolean)
                .join('. ')}
              onPress={() =>
                navigation.navigate(routes.Details, { id: record.id })
              }
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.rowContent}>
                <View style={styles.platformHeading}>
                  <PlatformIcon
                    platform={record.platform}
                    size={iconSizing.historyPlatform}
                  />
                  <View style={styles.heading}>
                    <AppText variant="heading">
                      {platformLabels[record.platform]}
                    </AppText>
                    <AppText secondary variant="supporting">
                      {record.timeLabel}
                    </AppText>
                    {deletion.state.id === record.id && (
                      <AppText
                        variant="supporting"
                        style={{ color: colors.primary }}
                      >
                        {t('deletionPending')}
                      </AppText>
                    )}
                  </View>
                </View>
                <View style={styles.amounts}>
                  <AppText variant="heading" style={styles.money}>
                    {record.fareLabel}
                  </AppText>
                  {record.tipCents > 0 && (
                    <AppText
                      secondary
                      variant="supporting"
                      style={styles.money}
                    >
                      {record.tipLabel}
                    </AppText>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          state.status === 'loading' ? <HistorySkeleton /> : undefined
        }
        ListFooterComponent={
          state.status === 'ready' ? (
            <View style={styles.footer}>
              {state.refreshing && (
                <View style={styles.feedback}>
                  <ActivityIndicator color={colors.primary} />
                  <AppText accessibilityLiveRegion="polite">
                    {t('dataRefreshing')}
                  </AppText>
                </View>
              )}
              {state.refreshError && (
                <View style={styles.feedback}>
                  <AppText accessibilityRole="alert">
                    {t('dataRefreshFailed')}
                  </AppText>
                  <ActionButton label={t('retry')} onPress={refresh} />
                </View>
              )}

              {!state.refreshing &&
                !state.refreshError &&
                (state.loadingMore ? (
                  <View style={styles.feedback}>
                    <ActivityIndicator color={colors.primary} />
                    <AppText accessibilityLiveRegion="polite">
                      {t('historyLoadingMore')}
                    </AppText>
                  </View>
                ) : state.loadMoreError ? (
                  <View style={styles.feedback}>
                    <AppText accessibilityRole="alert">
                      {t('historyLoadMoreFailed')}
                    </AppText>
                    <ActionButton label={t('retry')} onPress={loadMore} />
                  </View>
                ) : state.hasMore ? (
                  <ActionButton
                    label={t('historyLoadMore')}
                    variant="secondary"
                    onPress={loadMore}
                  />
                ) : null)}
            </View>
          ) : undefined
        }
      />
    </View>
  );
}
