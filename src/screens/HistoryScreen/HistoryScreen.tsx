import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { routes } from '../../navigation/routes';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { CollapsibleFilter } from '../../components/CollapsibleFilter/CollapsibleFilter';
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
import ChevronRight from '../../assets/icons/line/chevron-right.svg';
import EmptyWallet from '../../assets/illustrations/empty-wallet.svg';
import { dateTimeFormat } from '../../i18n/intlCache';

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
  const [periodExpanded, setPeriodExpanded] = useState(false);
  const [platformExpanded, setPlatformExpanded] = useState(false);
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
    const dateFormat = dateTimeFormat(locale, {
      timeZone: clock.timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormat = dateTimeFormat(locale, {
      timeZone: clock.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    return groups.map(group => ({
      ...group,
      dateLabel: dateFormat.format(group.date),
      totalLabel: formatMoney(
        group.records.reduce((sum, record) => sum + record.netCashCents, 0),
        locale,
      ),
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
  const listRef =
    useRef<SectionList<(typeof sections)[number]['data'][number]>>(null);
  const empty =
    state.status === 'ready' &&
    state.empty &&
    !state.refreshing &&
    !state.refreshError;
  const revealEmptyState = useCallback(() => {
    if (empty)
      listRef.current
        ?.getScrollResponder()
        ?.scrollTo({ x: 0, y: 0, animated: false });
  }, [empty]);
  useEffect(revealEmptyState, [revealEmptyState]);
  const header = (
    <View style={styles.controls}>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          {t('history')}
        </AppText>
        <AppText variant="supporting" secondary>
          {t('historySubtitle')}
        </AppText>
      </View>
      <CollapsibleFilter
        label={t('period')}
        value={
          period === 'month'
            ? `${t('month')} · ${formatPeriodRange(
                bounds,
                locale,
                clock.timeZone,
              )}`
            : t(period === 'day' ? 'today' : 'week')
        }
        expanded={periodExpanded}
        onToggle={() => setPeriodExpanded(expanded => !expanded)}
        testID="filter-period"
      >
        <ChoiceGroup
          hideLabel
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
      </CollapsibleFilter>
      <CollapsibleFilter
        label={t('platform')}
        value={
          platform === 'all' ? t('allPlatforms') : platformLabels[platform]
        }
        expanded={platformExpanded}
        onToggle={() => setPlatformExpanded(expanded => !expanded)}
        testID="filter-platform"
      >
        <ChoiceGroup
          hideLabel
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
      </CollapsibleFilter>
      {state.status === 'error' && (
        <TransactionLoadState status={state.status} retry={refresh} />
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
        <View style={styles.empty}>
          <EmptyWallet
            width={160}
            height={140}
            color={colors.primary}
            accessible={false}
          />
          <AppText variant="heading" style={styles.emptyTitle}>
            {t(
              existence.state.hasAny === false
                ? 'historyEmpty'
                : 'historyFilteredEmpty',
            )}
          </AppText>
          {existence.state.hasAny === false && (
            <View style={styles.emptyAction}>
              <ActionButton
                label={t('registerPayment')}
                onPress={() =>
                  navigation.navigate(routes.Tabs, { screen: routes.Home })
                }
              />
            </View>
          )}
        </View>
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
        ref={listRef}
        testID="history-list"
        sections={sections}
        keyExtractor={record => record.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onContentSizeChange={(_width, height) => {
          revealEmptyState();
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
        renderSectionHeader={({ section: group }) => (
          <View style={styles.groupHeading}>
            <AppText
              variant="heading"
              accessibilityRole="header"
              style={styles.groupTitle}
            >
              {clock.dayKey === group.key ? `${t('today')} · ` : ''}
              {group.dateLabel}
            </AppText>
            <AppText
              variant="supporting"
              secondary
              testID={`history-total-${group.key}`}
              style={styles.groupTotal}
            >
              {group.totalLabel}
            </AppText>
          </View>
        )}
        renderItem={({ item: record, index, section }) => {
          // Rows of one day form a single grouped card (Figma DayCard).
          const first = index === 0;
          const last = index === section.data.length - 1;
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
                first ? styles.rowFirst : styles.rowOverlap,
                last && styles.rowLast,
                {
                  backgroundColor: pressed ? colors.surfaceRaised : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {!first && (
                <View
                  style={[
                    styles.rowDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
              <View style={styles.rowContent}>
                <View style={styles.platformHeading}>
                  <PlatformIcon
                    platform={record.platform}
                    size={iconSizing.historyPlatform}
                  />
                  <View style={styles.heading}>
                    <AppText style={styles.platformName}>
                      {platformLabels[record.platform]}
                    </AppText>
                    <AppText secondary variant="supporting" style={styles.time}>
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
                  <AppText style={[styles.money, styles.fare]}>
                    {record.fareLabel}
                  </AppText>
                  {record.tipCents > 0 && (
                    <View
                      style={[
                        styles.tipChip,
                        { backgroundColor: colors.softGreen },
                      ]}
                    >
                      <AppText
                        variant="supporting"
                        style={[
                          styles.money,
                          styles.tip,
                          { color: colors.primary },
                        ]}
                      >
                        {record.tipLabel}
                      </AppText>
                    </View>
                  )}
                </View>
                <ChevronRight
                  width={18}
                  height={18}
                  color={colors.tertiaryText}
                  accessible={false}
                />
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          state.status === 'ready' ? (
            <View style={styles.footer}>
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
                (state.loadingMore ? null : state.loadMoreError ? (
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
