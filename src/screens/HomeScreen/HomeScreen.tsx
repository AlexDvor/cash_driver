import React, { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../../ui/AppText/AppText';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatLocalDateTime } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { DailySummary } from '../../components/DailySummary/DailySummary';
import { useDailySummary } from '../../hooks/summary/useDailySummary';
import { PaymentForm } from '../../components/PaymentForm/PaymentForm';
import { usePaymentForm } from '../../hooks/transactions/usePaymentForm';
import { useCreatePayment } from '../../hooks/transactions/useCreatePayment';
import { styles } from './HomeScreen.styles';

export function HomeScreen() {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { services, preferences, updatePreferences, saving, errorKey } =
    usePersistence();
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [summaryResetCount, setSummaryResetCount] = useState(0);
  const hideSummary = useCallback(() => {
    setSummaryExpanded(false);
    setSummaryResetCount(count => count + 1);
  }, []);
  useFocusEffect(useCallback(() => hideSummary, [hideSummary]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'inactive' || next === 'background') hideSummary();
    });
    return () => subscription.remove();
  }, [hideSummary]);
  const clock = useLocalClock();
  const daily = useDailySummary(clock);
  const onSubmit = useCreatePayment(services, preferences.hapticsEnabled);
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
      <DailySummary
        daily={daily}
        expanded={summaryExpanded}
        resetCount={summaryResetCount}
        onToggle={() => setSummaryExpanded(expanded => !expanded)}
      />
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
