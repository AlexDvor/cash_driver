import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../ui/AppText/AppText';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { usePersistence } from '../../app/PersistenceProvider';
import { useLocalClock } from '../../hooks/app/useLocalClock';
import { useTranslation } from '../../i18n/LanguageProvider';
import { formatLocalDateTime } from '../../i18n/formatting';
import { useAppTheme } from '../../theme/ThemeProvider';
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
