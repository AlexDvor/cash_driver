import React, { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../app/navigationTypes';
import { usePersistence } from '../../app/PersistenceProvider';
import { useLocalClock } from '../../app/useLocalClock';
import { ActionButton } from '../../components/ActionButton';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useTranslation } from '../../i18n/LanguageProvider';
import { formatLocalDateTime, formatMoney } from '../../i18n/formatting';
import { spacing } from '../../theme/tokens';
import { CashTransaction } from './types';
import { TransactionInput } from './transactionService';
import { platformLabels } from './history';
import { PaymentForm } from './PaymentForm';
import { usePaymentForm } from './usePaymentForm';
import { useTransactions } from './useTransactions';
import { TransactionLoadState } from './TransactionLoadState';
import { useDeletion } from './DeletionProvider';

export function DetailsScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Details'>) {
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
            onPress={() => navigation.navigate('Edit', { id: record.id })}
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

function LoadedEdit({
  record,
  cancel,
}: {
  record: CashTransaction;
  cancel: () => void;
}) {
  const { services } = usePersistence();
  const { t } = useTranslation();
  const deletion = useDeletion();
  const onSubmit = useCallback(
    async (input: TransactionInput) => {
      if (deletion.state.id === record.id) {
        throw new Error('Operation deletion is pending');
      }
      return services.transactions.edit(record.id, input);
    },
    [deletion.state.id, record.id, services],
  );
  const form = usePaymentForm({
    initialPlatform: record.platform,
    initialValues: {
      platform: record.platform,
      fareAmountCents: record.fareAmountCents,
      cashReceivedCents: record.cashReceivedCents,
      changeAsTip: record.tipCents > 0,
    },
    clearAfterSave: false,
    onSubmit,
  });
  if (deletion.state.id === record.id) {
    return <AppText>{t('deletionPending')}</AppText>;
  }
  return (
    <>
      <PaymentForm
        mode="edit"
        form={form}
        title={t('edit')}
        confirmLabel={t('saveChanges')}
        preferenceSaving={deletion.state.id === record.id}
      />
      <ActionButton
        variant="secondary"
        label={t('cancel')}
        disabled={form.saving}
        onPress={cancel}
      />
    </>
  );
}

export function EditScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Edit'>) {
  const { state, refresh } = useTransactions(route.params.id, false);
  const record = state.status === 'ready' ? state.records[0] : undefined;
  return (
    <ScreenContainer hasHeader>
      {state.status !== 'ready' && (
        <TransactionLoadState status={state.status} retry={refresh} />
      )}
      {state.status === 'ready' && !record && (
        <TransactionLoadState status="missing" retry={refresh} />
      )}
      {record && (
        <LoadedEdit
          key={record.id}
          record={record}
          cancel={() => navigation.goBack()}
        />
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
