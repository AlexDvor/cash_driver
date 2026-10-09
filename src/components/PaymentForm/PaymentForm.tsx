import React from 'react';
import { Keyboard, Pressable, useWindowDimensions, View } from 'react-native';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { MoneyInput } from '../../ui/MoneyInput/MoneyInput';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { sizing } from '../../constants/theme/tokens';
import { MAX_INPUT_CENTS } from '../../features/transactions/money';
import type { MoneyParseResult } from '../../features/transactions/money';
import { platforms, platformLabels } from '../../constants/platforms';
import type { PaymentFormProps } from './PaymentForm.interface';
import { styles } from './PaymentForm.styles';

export function PaymentForm({
  form,
  preferenceSaving = false,
  title,
  confirmLabel,
  mode = 'create',
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
  const excessiveTip =
    result?.status === 'invalid' &&
    result.field === 'tip' &&
    result.reason === 'exceedsAvailableChange';
  const tipError =
    excessiveTip && form.availableChangeCents !== null
      ? t('tipExceedsChange', {
          amount: formatMoney(form.availableChangeCents, locale),
        })
      : fieldError(form.tipParsed, false);
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
          label: platformLabels[value],
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
      <View style={styles.tipBlock}>
        <AppText variant="supporting" secondary>
          {t('optionalTip')}
        </AppText>
        <MoneyInput
          label={t('tipInput')}
          value={form.tip}
          error={tipError}
          disabled={disabled}
          onChange={raw => form.changeField('tip', raw)}
          onFocus={() => form.focus('tip')}
          onBlur={() => form.blur('tip')}
        />
        <View style={styles.quickRow}>
          {[
            { label: t('noTip'), onPress: form.clearTip, disabled },
            {
              label: t('allChangeAsTip'),
              onPress: form.allChangeAsTip,
              disabled:
                disabled ||
                form.availableChangeCents === null ||
                form.availableChangeCents === 0,
            },
          ].map(action => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: action.disabled }}
              disabled={action.disabled}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.quick,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
                (pressed || action.disabled) && styles.pressed,
              ]}
            >
              <AppText>{action.label}</AppText>
            </Pressable>
          ))}
        </View>
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
          {t(
            mode === 'edit'
              ? success.tipCents > 0
                ? 'updatedPaymentWithTip'
                : 'updatedPayment'
              : success.tipCents > 0
              ? 'savedPaymentWithTip'
              : 'savedPayment',
            {
              fare: formatMoney(success.fareAmountCents, locale),
              tip: formatMoney(success.tipCents, locale),
            },
          )}
        </AppText>
      )}
    </Card>
  );
}
