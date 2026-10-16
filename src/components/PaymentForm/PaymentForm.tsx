import React, { useRef, useState, type ComponentRef } from 'react';
import {
  Keyboard,
  Pressable,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useKeyboardVisible } from '../../hooks/app/useKeyboardVisible';
import { spacing } from '../../constants/theme/tokens';
import { CollapsibleTipContent } from '../CollapsibleTipContent/CollapsibleTipContent';
import { PlatformIcon } from '../PlatformIcon/PlatformIcon';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { MoneyInput } from '../../ui/MoneyInput/MoneyInput';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { MAX_INPUT_CENTS } from '../../features/transactions/money';
import type { MoneyParseResult } from '../../features/transactions/money';
import { platformLabels } from '../../constants/platforms';
import type { PaymentFormProps } from './PaymentForm.interface';
import { styles } from './PaymentForm.styles';

export function PaymentForm({
  form,
  platformOptions,
  preferenceSaving = false,
  title,
  confirmLabel,
  mode = 'create',
  entryNavigation,
}: PaymentFormProps) {
  const { t, locale } = useTranslation();
  const { colors } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const stackedTipActions = width / fontScale < 400;
  const [quickWidth, setQuickWidth] = useState(0);
  const quickCount = form.quickAmounts.length + (form.validFare ? 1 : 0);
  const quickColumns =
    quickCount > 0 &&
    quickWidth >= quickCount * 64 * fontScale + spacing.sm * (quickCount - 1)
      ? quickCount
      : 2;
  const quickStyle = {
    width:
      quickWidth > 0
        ? Math.floor(
            (quickWidth - spacing.sm * (quickColumns - 1)) / quickColumns,
          )
        : ('100%' as const),
    flexGrow: 1,
  };
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
    <Card style={styles.card}>
      {title && (
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
      )}
      <ChoiceGroup
        label={t('platform')}
        options={platformOptions.map(value => ({
          value,
          label: platformLabels[value],
          icon: <PlatformIcon platform={value} />,
        }))}
        iconLayout={platformOptions.length > 2 ? 'stacked' : 'inline'}
        columns="equal"
        value={form.platform}
        onChange={platform => {
          entryNavigation?.cancel();
          return form.choosePlatform(platform);
        }}
        disabled={disabled || preferenceSaving}
      />
      {mode === 'create' && !form.platformAllowed && (
        <AppText
          testID="platform-reselection-required"
          accessibilityRole="alert"
          style={{ color: colors.errorText }}
        >
          {t('platformReselectionRequired')}
        </AppText>
      )}
      <MoneyInput
        groupRef={entryNavigation?.fareRef}
        label={t('fareInput')}
        value={form.fare}
        error={fieldError(form.fareParsed, true)}
        disabled={disabled}
        onChange={raw => {
          entryNavigation?.changedFare();
          form.changeField('fare', raw);
        }}
        onFocus={() => {
          form.focus('fare');
          entryNavigation?.focus('fare');
        }}
        onBlur={() => {
          entryNavigation?.blur('fare');
          form.blur('fare');
        }}
      />
      <MoneyInput
        groupRef={entryNavigation?.receivedRef}
        inputRef={entryNavigation?.receivedInputRef}
        label={t('receivedInput')}
        value={form.received}
        error={fieldError(form.receivedParsed, false)}
        disabled={disabled}
        onChange={raw => {
          entryNavigation?.changedReceived();
          form.changeField('received', raw);
        }}
        onFocus={() => {
          form.focus('received');
          entryNavigation?.focus('received');
        }}
        onBlur={() => {
          entryNavigation?.blur('received');
          form.blur('received');
        }}
      />
      {quickCount > 0 && (
        <View
          style={styles.quickRow}
          onLayout={event => setQuickWidth(event.nativeEvent.layout.width)}
        >
          {form.quickAmounts.map(cents => (
            <Pressable
              key={cents}
              accessibilityRole="button"
              accessibilityLabel={formatMoney(cents, locale)}
              disabled={disabled}
              onPress={() => {
                entryNavigation?.cancel();
                if (form.quick(cents)) entryNavigation?.quickReceived();
              }}
              style={({ pressed }) => [
                styles.quick,
                quickStyle,
                {
                  backgroundColor: colors.softGreen,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppText
                variant="supporting"
                style={[styles.quickLabel, { color: colors.primary }]}
              >
                {formatMoney(cents, locale, true)}
              </AppText>
            </Pressable>
          ))}
          {form.validFare && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exact')}
              disabled={disabled}
              onPress={() => {
                entryNavigation?.cancel();
                if (form.quick()) entryNavigation?.quickReceived();
              }}
              style={({ pressed }) => [
                styles.quick,
                quickStyle,
                {
                  backgroundColor: colors.softGreen,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppText
                variant="supporting"
                style={[styles.quickLabel, { color: colors.primary }]}
              >
                {t('exact')}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.tipBlock}>
        <Pressable
          testID="tip-section-toggle"
          accessibilityRole="button"
          accessibilityLabel={tipHeader}
          accessibilityHint={`${t(
            form.tipExpanded ? 'collapseTip' : 'expandTip',
          )}. ${t('optionalTip')}`}
          accessibilityState={{ expanded: form.tipExpanded, disabled }}
          disabled={disabled}
          onPress={() => {
            entryNavigation?.cancel();
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
          <AppText style={styles.tipLabel}>
            {form.tipExpanded
              ? `${tipHeader} (${t('optionalTip')})`
              : tipHeader}
          </AppText>
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.tipChevron,
              {
                borderColor: colors.primary,
                transform: [{ rotate: form.tipExpanded ? '225deg' : '45deg' }],
              },
            ]}
          />
        </Pressable>
        <CollapsibleTipContent
          expanded={form.tipExpanded}
          resetCount={form.tipResetCount}
        >
          <MoneyInput
            inputRef={tipInput}
            label={t('tipInput')}
            hideLabel
            value={form.tip}
            error={tipError}
            disabled={disabled || !form.tipExpanded}
            onChange={raw => form.changeField('tip', raw)}
            onFocus={() => {
              entryNavigation?.cancel();
              tipFocused.current = true;
              form.focus('tip');
            }}
            onBlur={() => {
              tipFocused.current = false;
              form.blur('tip');
            }}
          />
          <View
            style={[
              styles.quickRow,
              stackedTipActions && styles.stackedActions,
            ]}
          >
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
                onPress={() => {
                  entryNavigation?.cancel();
                  action.onPress();
                }}
                style={({ pressed }) => [
                  styles.quick,
                  styles.tipAction,
                  stackedTipActions && styles.fullWidthAction,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                  (pressed || action.disabled) && styles.pressed,
                ]}
              >
                <AppText style={styles.actionLabel}>{action.label}</AppText>
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
                  : colors.primary,
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
          entryNavigation?.cancel();
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
