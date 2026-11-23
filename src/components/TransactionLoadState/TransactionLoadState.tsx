import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { IconPlate } from '../../ui/IconPlate/IconPlate';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { spacing } from '../../constants/theme/tokens';
import InfoIcon from '../../assets/icons/duotone/info.svg';

export function TransactionLoadState({
  status,
  retry,
}: {
  status: 'loading' | 'error' | 'missing';
  retry: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const message = (
    <AppText accessibilityRole={status === 'error' ? 'alert' : undefined}>
      {t(
        status === 'loading'
          ? 'operationsLoading'
          : status === 'error'
          ? 'operationsFailed'
          : 'operationMissing',
      )}
    </AppText>
  );
  return (
    <>
      {status === 'loading' && <ActivityIndicator color={colors.primary} />}
      {status === 'loading' ? (
        message
      ) : (
        <View style={styles.row}>
          <IconPlate icon={InfoIcon} tone="danger" />
          <View style={styles.text}>{message}</View>
        </View>
      )}
      {status === 'error' && (
        <ActionButton label={t('retry')} onPress={retry} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1 },
});
