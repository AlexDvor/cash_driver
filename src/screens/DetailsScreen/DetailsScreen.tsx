import { iconSizing, sizing } from '../../constants/theme/tokens';
import { summaryLayout } from '../../constants/theme/layout';
import React from 'react';
import { Alert, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { routes } from '../../navigation/routes';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatLocalDateTime, formatMoney } from '../../i18n/formatting';
import { platformLabels } from '../../constants/platforms';
import { useTransactions } from '../../hooks/transactions/useTransactions';
import { TransactionLoadState } from '../../components/TransactionLoadState/TransactionLoadState';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import { styles } from './DetailsScreen.styles';
import { PlatformIcon } from '../../components/PlatformIcon/PlatformIcon';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

export function DetailsScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, typeof routes.Details>) {
  const { state, refresh } = useTransactions(route.params.id);
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const clock = useLocalClock();
  const deletion = useDeletion();
  const record = state.status === 'ready' ? state.records[0] : undefined;
  const blocked = deletion.state.id === record?.id;
  function confirmDelete() {
    if (
      !record ||
      deletion.state.status !== 'idle' ||
      deletion.allStatus === 'writing'
    ) {
      return;
    }
    Alert.alert(t('deleteQuestion'), undefined, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deletion.begin(record.id),
      },
    ]);
  }
  const rows = record
    ? [
        { label: t('fareInput'), cents: record.fareAmountCents },
        { label: t('receivedInput'), cents: record.cashReceivedCents },
        { label: t('changeGiven'), cents: record.changeGivenCents },
        {
          label: t('tipsTotal'),
          cents: record.tipCents,
          accent: record.tipCents > 0,
        },
      ]
    : [];
  return (
    <ScreenContainer hasHeader>
      {state.status !== 'ready' && (
        <TransactionLoadState status={state.status} retry={refresh} />
      )}
      {state.status === 'ready' && !record && (
        <TransactionLoadState status="missing" retry={refresh} />
      )}
      {record && (
        <>
          <View style={styles.platformHeading}>
            <PlatformIcon
              platform={record.platform}
              size={iconSizing.detailsPlatform}
            />
            <View style={styles.headingText}>
              <AppText variant="heading">
                {platformLabels[record.platform]}
              </AppText>
              <AppText secondary>
                {formatLocalDateTime(
                  new Date(record.createdAt),
                  locale,
                  clock.timeZone,
                )}
              </AppText>
            </View>
          </View>
          <Card depth style={styles.hero}>
            <View style={styles.heroMain}>
              <AppText variant="supporting" secondary>
                {t('retainedCash')}
              </AppText>
              <AppText
                style={styles.heroAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={summaryLayout.countMinimumFontScale}
              >
                {formatMoney(record.netCashCents, locale)}
              </AppText>
            </View>
            {record.tipCents > 0 && (
              <AppText variant="supporting" style={{ color: colors.primary }}>
                {t('tipAmount', {
                  amount: formatMoney(record.tipCents, locale),
                })}
              </AppText>
            )}
          </Card>
          <Card>
            {rows.map((value, index) => (
              <View
                key={value.label}
                style={[
                  styles.value,
                  index > 0 && {
                    borderTopWidth: sizing.borderWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <AppText secondary style={styles.valueLabel}>
                  {value.label}
                </AppText>
                <AppText
                  style={[
                    styles.amount,
                    value.accent && { color: colors.primary },
                  ]}
                >
                  {formatMoney(value.cents, locale)}
                </AppText>
              </View>
            ))}
          </Card>
          <ActionButton
            variant="primary"
            label={t('editAction')}
            disabled={blocked}
            onPress={() => navigation.navigate(routes.Edit, { id: record.id })}
          />
          <ActionButton
            variant="destructive"
            label={t('delete')}
            disabled={
              deletion.state.status !== 'idle' ||
              deletion.allStatus === 'writing'
            }
            onPress={confirmDelete}
          />
        </>
      )}
    </ScreenContainer>
  );
}
