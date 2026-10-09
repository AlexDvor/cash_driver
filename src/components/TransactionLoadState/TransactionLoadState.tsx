import React from 'react';
import { ActivityIndicator } from 'react-native';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

export function TransactionLoadState({
  status,
  retry,
}: {
  status: 'loading' | 'error' | 'missing';
  retry: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <>
      {status === 'loading' && <ActivityIndicator color={colors.primary} />}
      <AppText accessibilityRole={status === 'error' ? 'alert' : undefined}>
        {t(
          status === 'loading'
            ? 'operationsLoading'
            : status === 'error'
            ? 'operationsFailed'
            : 'operationMissing',
        )}
      </AppText>
      {status === 'error' && (
        <ActionButton label={t('retry')} onPress={retry} />
      )}
    </>
  );
}
