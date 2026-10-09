import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { routes } from '../../navigation/routes';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import {
  groupHistory,
  HistoryPeriod,
  HistoryPlatform,
  localDateKey,
  platformLabels,
} from '../../features/transactions/history';
import { platforms } from '../../features/transactions/types';
import { useTransactions } from '../../hooks/transactions/useTransactions';
import { TransactionLoadState } from '../../components/TransactionLoadState/TransactionLoadState';
import { styles } from './HistoryScreen.styles';

export function HistoryScreen() {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const clock = useLocalClock();
  const { state, refresh } = useTransactions();
  const deletion = useDeletion();
  const [period, setPeriod] = useState<HistoryPeriod>('day');
  const [platform, setPlatform] = useState<HistoryPlatform>('all');
  const groups =
    state.status === 'ready'
      ? groupHistory(state.records, period, platform, clock.now, clock.timeZone)
      : [];
  return (
    <ScreenContainer>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          {t('history')}
        </AppText>
        <AppText secondary>{t('historySubtitle')}</AppText>
      </View>
      <ChoiceGroup
        label={t('period')}
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'day', label: t('today') },
          { value: 'week', label: t('week') },
          { value: 'month', label: t('month') },
          { value: 'all', label: t('allTime') },
        ]}
      />
      <ChoiceGroup
        label={t('platform')}
        value={platform}
        onChange={setPlatform}
        options={[
          { value: 'all', label: t('allPlatforms') },
          ...platforms.map(value => ({ value, label: platformLabels[value] })),
        ]}
      />
      {state.status !== 'ready' && (
        <TransactionLoadState status={state.status} retry={refresh} />
      )}
      {state.status === 'ready' && groups.length === 0 && (
        <>
          <AppText>
            {t(
              state.records.length === 0
                ? 'historyEmpty'
                : 'historyFilteredEmpty',
            )}
          </AppText>
          {state.records.length === 0 && (
            <ActionButton
              label={t('registerPayment')}
              onPress={() =>
                navigation.navigate(routes.Tabs, { screen: routes.Home })
              }
            />
          )}
        </>
      )}
      {groups.map(group => (
        <View key={group.key} style={styles.group}>
          <AppText variant="heading" accessibilityRole="header">
            {localDateKey(clock.now, clock.timeZone) === group.key
              ? `${t('today')} · `
              : ''}
            {new Intl.DateTimeFormat(locale, {
              timeZone: clock.timeZone,
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(group.date)}
          </AppText>
          {group.records.map(record => {
            const time = new Intl.DateTimeFormat(locale, {
              timeZone: clock.timeZone,
              hour: '2-digit',
              minute: '2-digit',
              hourCycle: 'h23',
            }).format(new Date(record.createdAt));
            return (
              <Pressable
                key={record.id}
                testID={`history-${record.id}`}
                accessibilityRole="button"
                accessibilityLabel={t('openOperation', {
                  platform: platformLabels[record.platform],
                  time,
                  fare: formatMoney(record.fareAmountCents, locale),
                })}
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
                  <View style={styles.heading}>
                    <AppText variant="heading">
                      {platformLabels[record.platform]}
                    </AppText>
                    <AppText secondary variant="supporting">
                      {time}
                    </AppText>
                  </View>
                  <View style={styles.amounts}>
                    <AppText variant="heading">
                      {formatMoney(record.fareAmountCents, locale)}
                    </AppText>
                    {record.tipCents > 0 && (
                      <AppText secondary variant="supporting">
                        {t('tipAmount', {
                          amount: formatMoney(record.tipCents, locale),
                        })}
                      </AppText>
                    )}
                  </View>
                </View>
                <AppText variant="supporting" style={{ color: colors.primary }}>
                  {t(
                    deletion.state.id === record.id
                      ? 'deletionPending'
                      : 'recorded',
                  )}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScreenContainer>
  );
}
