import React from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { MoneyInput } from '../../components/MoneyInput';
import { useTranslation } from '../../i18n/LanguageProvider';
import { formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../theme/ThemeProvider';
import { radii, sizing, spacing, typography } from '../../theme/tokens';
import { MAX_INPUT_CENTS, MoneyParseResult } from './money';
import { platforms } from './types';
import { usePaymentForm } from './usePaymentForm';

interface PaymentFormProps {
  form: ReturnType<typeof usePaymentForm>;
  preferenceSaving?: boolean;
  title: string;
  confirmLabel: string;
}
export function PaymentForm({
  form,
  preferenceSaving = false,
  title,
  confirmLabel,
}: PaymentFormProps) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const disabled = form.saving;
  function fieldError(parsed: MoneyParseResult, fare: boolean) {
    if (parsed.status === 'invalid') {
      return parsed.reason === 'aboveMaximum'
        ? t('maximumMoney', { amount: formatMoney(MAX_INPUT_CENTS, locale) })
        : t('invalidMoney');
    }
    if (fare && parsed.status === 'valid' && parsed.cents === 0) {
      return t('positiveFare');
    }
    return undefined;
  }
  const result = form.payment;
  const success = form.saved;
  return (
    <Card>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <ChoiceGroup
        label={t('platform')}
        options={platforms.map(value => ({
          value,
          label:
            value === 'other'
              ? 'Otro'
              : value[0].toUpperCase() + value.slice(1),
        }))}
        columns={
          width / fontScale >= sizing.platformFourColumnScreenWidth ? 4 : 2
        }
        value={form.platform}
        onChange={form.choosePlatform}
        disabled={disabled || preferenceSaving}
      />
      <MoneyInput
        label={t('fareInput')}
        value={form.fare}
        error={fieldError(form.fareParsed, true)}
        disabled={disabled}
        onChange={raw => form.changeField('fare', raw)}
        onFocus={() => form.focus('fare')}
        onBlur={() => form.blur('fare')}
      />
      <MoneyInput
        label={t('receivedInput')}
        value={form.received}
        error={fieldError(form.receivedParsed, false)}
        disabled={disabled}
        onChange={raw => form.changeField('received', raw)}
        onFocus={() => form.focus('received')}
        onBlur={() => form.blur('received')}
      />
      <View style={styles.quickRow}>
        {form.quickAmounts.map(cents => (
          <Pressable
            key={cents}
            accessibilityRole="button"
            accessibilityLabel={formatMoney(cents, locale)}
            disabled={disabled}
            onPress={() => form.quick(cents)}
            style={({ pressed }) => [
              styles.quick,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
              pressed && styles.pressed,
            ]}
          >
            <AppText>{formatMoney(cents, locale)}</AppText>
          </Pressable>
        ))}
        {form.validFare && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exact')}
            disabled={disabled}
            onPress={() => form.quick()}
            style={({ pressed }) => [
              styles.quick,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
              pressed && styles.pressed,
            ]}
          >
            <AppText>{t('exact')}</AppText>
          </Pressable>
        )}
      </View>
      <View
        style={[
          styles.result,
          {
            backgroundColor:
              result?.status === 'insufficient'
                ? colors.errorSurface
                : colors.softGreen,
          },
        ]}
      >
        <AppText variant="supporting">{t('change')}</AppText>
        <AppText
          testID="change-result"
          style={[
            styles.amount,
            {
              color:
                result?.status === 'insufficient'
                  ? colors.errorText
                  : colors.text,
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
      {form.canTip && (
        <View style={styles.tipRow}>
          <AppText style={styles.tipLabel}>{t('changeIsTip')}</AppText>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={t('changeIsTip')}
            accessibilityState={{ checked: form.changeAsTip, disabled }}
            disabled={disabled}
            onPress={() => form.toggleTip(!form.changeAsTip)}
            style={styles.tipControl}
          >
            <View
              pointerEvents="none"
              importantForAccessibility="no-hide-descendants"
            >
              <Switch
                accessible={false}
                accessibilityLabel={t('changeIsTip')}
                disabled={disabled}
                value={form.changeAsTip}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          </Pressable>
        </View>
      )}
      {result?.status === 'valid' && result.tipCents > 0 && (
        <AppText>
          {t('tipAmount', { amount: formatMoney(result.tipCents, locale) })}
        </AppText>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dismissKeyboard')}
        onPress={Keyboard.dismiss}
        style={styles.dismiss}
      >
        <AppText variant="supporting" style={{ color: colors.primary }}>
          {t('dismissKeyboard')}
        </AppText>
      </Pressable>
      {form.failed && (
        <AppText accessibilityRole="alert" style={{ color: colors.errorText }}>
          {t('paymentFailed')}
        </AppText>
      )}
      <ActionButton
        loading={form.saving}
        label={
          form.saving
            ? t('savingPayment')
            : form.failed
            ? t('retryPayment')
            : confirmLabel
        }
        disabled={!form.canConfirm || preferenceSaving}
        onPress={async () => {
          if (await form.submit()) {
            Keyboard.dismiss();
          }
        }}
      />
      {success && (
        <AppText
          testID="payment-success"
          accessibilityLiveRegion="polite"
          style={{ color: colors.primary }}
        >
          {t(success.tipCents > 0 ? 'savedPaymentWithTip' : 'savedPayment', {
            fare: formatMoney(success.fareAmountCents, locale),
            tip: formatMoney(success.tipCents, locale),
          })}
        </AppText>
      )}
    </Card>
  );
}
const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quick: {
    minHeight: sizing.touchTarget,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.chip,
    padding: spacing.md,
    justifyContent: 'center',
    flexShrink: 1,
  },
  pressed: { opacity: 0.7 },
  result: { borderRadius: radii.input, padding: spacing.lg, gap: spacing.sm },
  amount: {
    fontSize: typography.change,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  missing: { fontSize: typography.money },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tipLabel: { flex: 1 },
  tipControl: {
    minHeight: sizing.touchTarget,
    minWidth: sizing.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismiss: { minHeight: sizing.touchTarget, justifyContent: 'center' },
});
