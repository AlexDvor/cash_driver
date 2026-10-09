import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../app/navigationTypes';
import { usePersistence } from '../../app/PersistenceProvider';
import { ActionButton } from '../../components/ActionButton';
import { AppText } from '../../components/AppText';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useTranslation } from '../../i18n/LanguageProvider';
import { CashTransaction } from '../../features/transactions/types';
import { TransactionInput } from '../../features/transactions/transactionService';
import { PaymentForm } from '../../features/transactions/PaymentForm';
import { usePaymentForm } from '../../hooks/transactions/usePaymentForm';
import { useTransactions } from '../../hooks/transactions/useTransactions';
import { TransactionLoadState } from '../../features/transactions/TransactionLoadState';
import { useDeletion } from '../../features/transactions/DeletionProvider';

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
