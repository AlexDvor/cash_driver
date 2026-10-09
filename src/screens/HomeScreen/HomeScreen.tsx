import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { AppText } from '../../components/AppText';
import { ScreenContainer } from '../../components/ScreenContainer';
import { usePersistence } from '../../app/PersistenceProvider';
import { useLocalClock } from '../../app/useLocalClock';
import { useTranslation } from '../../i18n/LanguageProvider';
import { formatLocalDateTime } from '../../i18n/formatting';
import { useAppTheme } from '../../theme/ThemeProvider';
import { DailySummary } from '../../features/summary/DailySummary';
import { useDailySummary } from '../../features/summary/useDailySummary';
import { PaymentForm } from '../../features/transactions/PaymentForm';
import { usePaymentForm } from '../../features/transactions/usePaymentForm';
import {
  PendingOperation,
  TransactionInput,
} from '../../features/transactions/transactionService';
import { confirmationHaptics } from '../../features/settings/confirmationHaptics';
import { styles } from './HomeScreen.styles';

export function HomeScreen() {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { services, preferences, updatePreferences, saving, errorKey } =
    usePersistence();
  const clock = useLocalClock();
  const daily = useDailySummary(clock);
  const hapticsEnabled = useRef(preferences.hapticsEnabled);
  hapticsEnabled.current = preferences.hapticsEnabled;
  const pending = useRef<{
    operation: PendingOperation;
    input: TransactionInput;
  } | null>(null);
  const onSubmit = useCallback(
    async (input: TransactionInput) => {
      const previous = pending.current;
      if (
        !previous ||
        previous.input.platform !== input.platform ||
        previous.input.fareAmountCents !== input.fareAmountCents ||
        previous.input.cashReceivedCents !== input.cashReceivedCents ||
        previous.input.changeAsTip !== input.changeAsTip
      ) {
        pending.current = {
          operation: services.transactions.newPendingOperation(),
          input: { ...input },
        };
      }
      const operation = pending.current?.operation;
      if (!operation) {
        throw new Error('Missing pending operation');
      }
      const saved = await services.transactions.save(operation, input);
      pending.current = null;
      confirmationHaptics(hapticsEnabled.current);
      return saved;
    },
    [services],
  );
  const form = usePaymentForm({
    initialPlatform: preferences.defaultPlatform,
    onSubmit,
    onPlatformChange: platform =>
      updatePreferences({ defaultPlatform: platform }),
  });
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t('appName')}
        </AppText>
        <AppText secondary>{t('subtitle')}</AppText>
        <AppText variant="supporting" secondary>
          {formatLocalDateTime(clock.now, locale, clock.timeZone)}
        </AppText>
      </View>
      <DailySummary daily={daily} />
      {errorKey && (
        <AppText accessibilityRole="alert" style={{ color: colors.errorText }}>
          {t(errorKey)}
        </AppText>
      )}
      <PaymentForm
        form={form}
        preferenceSaving={saving}
        title={t('newPayment')}
        confirmLabel={t('confirmPayment')}
      />
    </ScreenContainer>
  );
}
