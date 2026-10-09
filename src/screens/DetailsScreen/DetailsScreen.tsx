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
import { platformLabels } from '../../features/transactions/history';
import { useTransactions } from '../../hooks/transactions/useTransactions';
import { TransactionLoadState } from '../../components/TransactionLoadState/TransactionLoadState';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import { styles } from './DetailsScreen.styles';

export function DetailsScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, typeof routes.Details>) {
  const { state, refresh } = useTransactions(route.params.id);
  const { t, locale } = useTranslation();
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
          <AppText variant="heading">{platformLabels[record.platform]}</AppText>
          <AppText secondary>
            {formatLocalDateTime(
              new Date(record.createdAt),
              locale,
              clock.timeZone,
            )}
          </AppText>
          <Card>
            {[
              { label: t('fareInput'), cents: record.fareAmountCents },
              { label: t('receivedInput'), cents: record.cashReceivedCents },
              { label: t('changeGiven'), cents: record.changeGivenCents },
              { label: t('tipsTotal'), cents: record.tipCents },
              { label: t('retainedCash'), cents: record.netCashCents },
            ].map(value => (
              <View key={value.label} style={styles.value}>
                <AppText secondary>{value.label}</AppText>
                <AppText variant="heading">
                  {formatMoney(value.cents, locale)}
                </AppText>
              </View>
            ))}
          </Card>
          <ActionButton
            variant="secondary"
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
