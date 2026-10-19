import React from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { useKeyboardVisible } from '../../hooks/app/useKeyboardVisible';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { formatMoney } from '../../i18n/formatting';
import type { PaymentOutcomeProps } from './PaymentOutcome.interface';
import { styles } from './PaymentOutcome.styles';

export function PaymentOutcome({
  form,
  confirmLabel,
  mode = 'create',
  preferenceSaving = false,
  entryNavigation,
  onLayout,
  outcomeRef,
}: PaymentOutcomeProps) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const keyboardVisible = useKeyboardVisible();
  const result = form.payment;
  const success = form.saved;
  return (
    <View
      ref={outcomeRef}
      collapsable={false}
      onLayout={onLayout}
      testID="payment-outcome"
    >
      <Card style={styles.card}>
        <View
          style={[
            styles.result,
            {
              backgroundColor:
                result?.status === 'insufficient'
                  ? colors.errorSurface
                  : result?.status === 'valid'
                  ? colors.softGreen
                  : colors.card,
            },
          ]}
        >
          <AppText variant="supporting">{t('changeToReturn')}</AppText>
          <AppText
            testID="change-result"
            style={[
              styles.amount,
              {
                color:
                  result?.status === 'insufficient'
                    ? colors.errorText
                    : result?.status === 'valid'
                    ? colors.primary
                    : colors.secondaryText,
              },
              result?.status === 'insufficient' && styles.missing,
            ]}
          >
            {result?.status === 'valid'
              ? formatMoney(result.changeGivenCents, locale)
              : result?.status === 'insufficient'
              ? t('missingCash', {
                  amount: formatMoney(result.missingCents, locale),
                })
              : '—'}
          </AppText>
          {result?.status === 'insufficient' && (
            <AppText
              accessibilityRole="alert"
              style={{ color: colors.errorText }}
            >
              {t('insufficientCash')}
            </AppText>
          )}
        </View>
        {keyboardVisible && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dismissKeyboard')}
            onPress={() => {
              entryNavigation?.cancel();
              Keyboard.dismiss();
            }}
            style={styles.dismiss}
          >
            <AppText variant="supporting" style={{ color: colors.primary }}>
              {t('dismissKeyboard')}
            </AppText>
          </Pressable>
        )}
        {form.failed && (
          <AppText
            accessibilityRole="alert"
            style={{ color: colors.errorText }}
          >
            {t(mode === 'edit' ? 'editFailed' : 'paymentFailed')}
          </AppText>
        )}
        <ActionButton
          loading={form.saving}
          label={
            form.saving
              ? t('savingPayment')
              : form.failed
              ? t(mode === 'edit' ? 'retryEdit' : 'retryPayment')
              : confirmLabel
          }
          disabled={!form.canConfirm || preferenceSaving}
          onPress={async () => {
            entryNavigation?.cancel();
            if (await form.submit()) {
              Keyboard.dismiss();
            }
          }}
        />
        {mode === 'edit' && success && (
          <AppText
            testID="payment-success"
            accessibilityLiveRegion="polite"
            style={{ color: colors.primary }}
          >
            {t(
              success.tipCents > 0 ? 'updatedPaymentWithTip' : 'updatedPayment',
              {
                fare: formatMoney(success.fareAmountCents, locale),
                tip: formatMoney(success.tipCents, locale),
              },
            )}
          </AppText>
        )}
      </Card>
    </View>
  );
}
