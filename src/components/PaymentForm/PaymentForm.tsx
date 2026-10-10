import React, { useRef, type ComponentRef } from 'react';
import {
  Keyboard,
  Pressable,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { CollapsibleTipContent } from '../CollapsibleTipContent/CollapsibleTipContent';
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
  const tipInput = useRef<ComponentRef<typeof TextInput>>(null);
  const tipFocused = useRef(false);
  function finishTipFocus() {
    if (tipFocused.current) {
      tipFocused.current = false;
      tipInput.current?.blur();
      Keyboard.dismiss();
    }
  }
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
    (form.tipParsed.status === 'valid' || form.tipParsed.status === 'draft') &&
    form.availableChangeCents !== null &&
    form.tipParsed.cents > form.availableChangeCents;
  const tipError =
    excessiveTip && form.availableChangeCents !== null
      ? t('tipExceedsChange', {
          amount: formatMoney(form.availableChangeCents, locale),
        })
      : fieldError(form.tipParsed, false);
  const success = form.saved;
  const tipHeader =
    form.tipParsed.status === 'valid' && form.tipParsed.cents > 0 && !tipError
      ? t('tipAmount', { amount: formatMoney(form.tipParsed.cents, locale) })
      : form.tipExpanded
      ? t('tipInput')
      : t('addTip');
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
        <Pressable
          testID="tip-section-toggle"
          accessibilityRole="button"
          accessibilityLabel={tipHeader}
          accessibilityHint={t(form.tipExpanded ? 'collapseTip' : 'expandTip')}
          accessibilityState={{ expanded: form.tipExpanded, disabled }}
          disabled={disabled}
          onPress={() => {
            if (disabled) return;
            if (form.tipExpanded) {
              if (form.collapseTip()) finishTipFocus();
            } else {
              form.expandTip();
            }
          }}
          style={({ pressed }) => [
            styles.tipHeader,
            { borderColor: colors.border, backgroundColor: colors.background },
            (pressed || disabled) && styles.pressed,
          ]}
        >
          <AppText>{tipHeader}</AppText>
        </Pressable>
        <CollapsibleTipContent
          expanded={form.tipExpanded}
          resetCount={form.tipResetCount}
        >
          <AppText variant="supporting" secondary>
            {t('optionalTip')}
          </AppText>
          <MoneyInput
            inputRef={tipInput}
            label={t('tipInput')}
            value={form.tip}
            error={tipError}
            disabled={disabled || !form.tipExpanded}
            onChange={raw => form.changeField('tip', raw)}
            onFocus={() => {
              tipFocused.current = true;
              form.focus('tip');
            }}
            onBlur={() => {
              tipFocused.current = false;
              form.blur('tip');
            }}
          />
          <View style={styles.quickRow}>
            {[
              {
                label: t('removeTip'),
                onPress: () => {
                  form.removeTip();
                  finishTipFocus();
                },
                disabled: disabled || !form.tipExpanded,
              },
              {
                label: t('allChangeAsTip'),
                onPress: form.allChangeAsTip,
                disabled:
                  disabled ||
                  !form.tipExpanded ||
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
        </CollapsibleTipContent>
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
