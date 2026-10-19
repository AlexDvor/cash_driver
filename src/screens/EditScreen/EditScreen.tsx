import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { routes } from '../../navigation/routes';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { CashTransaction } from '../../features/transactions/types';
import { TransactionInput } from '../../features/transactions/transactionService';
import { PaymentForm } from '../../components/PaymentForm/PaymentForm';
import { usePaymentForm } from '../../hooks/transactions/usePaymentForm';
import { useHomePaymentScroll } from '../../hooks/transactions/useHomePaymentScroll';
import { useTransactions } from '../../hooks/transactions/useTransactions';
import { TransactionLoadState } from '../../components/TransactionLoadState/TransactionLoadState';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import { platforms } from '../../constants/platforms';

function LoadedEdit({
  record,
  cancel,
  entryNavigation,
}: {
  record: CashTransaction;
  cancel: () => void;
  entryNavigation: ReturnType<typeof useHomePaymentScroll>;
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
      tipCents: record.tipCents,
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
        entryNavigation={entryNavigation}
        mode="edit"
        form={form}
        platformOptions={platforms}
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
}: NativeStackScreenProps<RootStackParamList, typeof routes.Edit>) {
  const { state, refresh } = useTransactions(route.params.id, false);
  const record = state.status === 'ready' ? state.records[0] : undefined;
  const entryNavigation = useHomePaymentScroll({
    fare: '',
    received: '',
    validFare: false,
    validReceived: false,
    saving: false,
    automaticEntry: false,
  });
  return (
    <ScreenContainer
      hasHeader
      scrollRef={entryNavigation.scrollRef}
      contentRef={entryNavigation.contentRef}
      onInteraction={entryNavigation.cancel}
      keyboardInset={entryNavigation.keyboardInset}
      onContentSizeChange={entryNavigation.contentResized}
    >
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
          entryNavigation={entryNavigation}
          cancel={() => navigation.goBack()}
        />
      )}
    </ScreenContainer>
  );
}
