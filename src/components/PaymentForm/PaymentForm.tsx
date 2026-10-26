import { paymentLayout } from '../../constants/theme/layout';
import React, { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Keyboard,
  Pressable,
  TextInput,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { spacing, sizing } from '../../constants/theme/tokens';
import { CollapsibleTipContent } from '../CollapsibleTipContent/CollapsibleTipContent';
import { PlatformIcon } from '../PlatformIcon/PlatformIcon';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { MoneyInput } from '../../ui/MoneyInput/MoneyInput';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { centsToInput, formatMoney } from '../../i18n/formatting';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { MAX_INPUT_CENTS } from '../../features/transactions/money';
import type { MoneyParseResult } from '../../features/transactions/money';
import { platformLabels } from '../../constants/platforms';
import type { PaymentFormProps } from './PaymentForm.interface';
import { styles } from './PaymentForm.styles';
import { PaymentOutcome } from '../PaymentOutcome/PaymentOutcome';

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
  const { fontScale } = useWindowDimensions();
  const [quickWidth, setQuickWidth] = useState(0);
  const [fieldsWidth, setFieldsWidth] = useState(0);
  const stackedTipActions =
    fieldsWidth / fontScale < paymentLayout.tipActionsStackWidth;
  const [moneyMeasure, setMoneyMeasure] = useState({ key: '', width: 0 });
  const measureKey = `${fontScale}:${locale}`;
  const pairedFields =
    moneyMeasure.key === measureKey &&
    fieldsWidth >=
      2 * (moneyMeasure.width + spacing.sm * 3 + sizing.borderWidth * 2) +
        spacing.md;
  const quickCount = form.quickAmounts.length + (form.validFare ? 1 : 0);
  const quickColumns =
    quickCount > 0 &&
    quickWidth >=
      quickCount * paymentLayout.quickAmountMinimumWidth * fontScale +
        spacing.sm * (quickCount - 1)
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
  const previousTipExpanded = useRef(form.tipExpanded);
  const closedTip = entryNavigation?.closedTip;
  useEffect(() => {
    if (previousTipExpanded.current && !form.tipExpanded)
      closedTip?.(!form.saved);
    previousTipExpanded.current = form.tipExpanded;
  }, [form.tipExpanded, form.saved, closedTip]);
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
  const tipHeader =
    form.tipParsed.status === 'valid' && form.tipParsed.cents > 0 && !tipError
      ? t('tipAmount', { amount: formatMoney(form.tipParsed.cents, locale) })
      : form.tipExpanded
      ? t('tipInput')
      : t('addTip');
  const positiveTip =
    form.tipParsed.status === 'valid' && form.tipParsed.cents > 0 && !tipError;
  return (
    <>
      <Card depth style={styles.card}>
        <View
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.measurement}
        >
          <Text
            testID="payment-money-measure"
            key={measureKey}
            style={styles.moneyMeasure}
            onTextLayout={event => {
              const measured = event.nativeEvent.lines[0]?.width;
              if (measured)
                setMoneyMeasure({
                  key: measureKey,
                  width: Math.ceil(measured),
                });
            }}
          >{`${centsToInput(MAX_INPUT_CENTS)} €`}</Text>
        </View>
        {title && (
          <AppText variant="heading" accessibilityRole="header">
            {title}
          </AppText>
        )}
        {mode === 'create' && platformOptions.length === 1 ? (
          <View style={styles.platformRow}>
            <AppText style={styles.platformLabel}>{t('platform')}</AppText>
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={platformLabels[platformOptions[0]]}
              accessibilityState={{
                selected: form.platform === platformOptions[0],
                disabled: disabled || preferenceSaving,
              }}
              disabled={disabled || preferenceSaving}
              onPress={() => {
                entryNavigation?.cancel();
                form.choosePlatform(platformOptions[0]);
              }}
              style={({ pressed }) => [
                styles.singlePlatform,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <PlatformIcon platform={platformOptions[0]} />
              <AppText
                style={{
                  color:
                    form.platform === platformOptions[0]
                      ? colors.primary
                      : colors.text,
                }}
              >
                {platformLabels[platformOptions[0]]}
              </AppText>
            </Pressable>
          </View>
        ) : (
          <ChoiceGroup
            label={t('platform')}
            options={platformOptions.map(value => ({
              value,
              label: platformLabels[value],
              icon: <PlatformIcon platform={value} />,
            }))}
            iconLayout="inline"
            columns="adaptive"
            headingVariant="body"
            value={form.platform}
            onChange={platform => {
              entryNavigation?.cancel();
              return form.choosePlatform(platform);
            }}
            disabled={disabled || preferenceSaving}
          />
        )}
        {mode === 'create' && !form.platformAllowed && (
          <AppText
            testID="platform-reselection-required"
            accessibilityRole="alert"
            style={{ color: colors.errorText }}
          >
            {t('platformReselectionRequired')}
          </AppText>
        )}
        <View
          testID="payment-money-fields"
          onLayout={event => setFieldsWidth(event.nativeEvent.layout.width)}
          style={[styles.moneyFields, pairedFields && styles.pairedFields]}
        >
          <View style={styles.moneyColumn}>
            <MoneyInput
              compact
              showCurrency
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
          </View>
          <View style={styles.moneyColumn}>
            <MoneyInput
              compact
              showCurrency
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
          </View>
        </View>
        {quickCount > 0 && (
          <View
            collapsable={false}
            style={styles.quickRow}
            onLayout={event => {
              setQuickWidth(event.nativeEvent.layout.width);
            }}
          >
            {form.quickAmounts.map(cents => (
              <Pressable
                key={cents}
                accessibilityRole="button"
                accessibilityLabel={formatMoney(cents, locale)}
                accessibilityState={{
                  selected:
                    form.receivedParsed.status === 'valid' &&
                    form.receivedParsed.cents === cents,
                  disabled,
                }}
                disabled={disabled}
                onPress={() => {
                  entryNavigation?.cancel();
                  if (form.quick(cents)) entryNavigation?.quickReceived();
                }}
                style={({ pressed }) => [
                  styles.quick,
                  quickStyle,
                  {
                    backgroundColor:
                      form.receivedParsed.status === 'valid' &&
                      form.receivedParsed.cents === cents
                        ? colors.primary
                        : colors.softGreen,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  variant="supporting"
                  style={[
                    styles.quickLabel,
                    {
                      color:
                        form.receivedParsed.status === 'valid' &&
                        form.receivedParsed.cents === cents
                          ? colors.onPrimary
                          : colors.primary,
                    },
                  ]}
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
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    borderWidth: sizing.borderWidth,
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
        <View
          ref={entryNavigation?.tipRef}
          collapsable={false}
          style={styles.tipBlock}
        >
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
                entryNavigation?.openTip();
              }
            }}
            style={({ pressed }) => [
              styles.tipHeader,
              { borderColor: colors.border, backgroundColor: colors.card },
              (pressed || disabled) && styles.pressed,
            ]}
          >
            <AppText
              accessible={false}
              importantForAccessibility="no"
              style={{ color: colors.primary }}
            >
              +
            </AppText>
            <AppText style={styles.tipLabel}>
              {positiveTip || form.tipExpanded
                ? t('tipInput')
                : t('addTip').replace(/^\+\s*/, '')}
            </AppText>
            {positiveTip && form.tipParsed.status === 'valid' && (
              <AppText
                testID="tip-amount-badge"
                variant="supporting"
                style={[
                  styles.tipBadge,
                  { color: colors.primary, backgroundColor: colors.softGreen },
                ]}
              >
                {formatMoney(form.tipParsed.cents, locale)}
              </AppText>
            )}
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.tipChevron,
                {
                  borderColor: colors.primary,
                  transform: [
                    { rotate: form.tipExpanded ? '225deg' : '45deg' },
                  ],
                },
              ]}
            />
          </Pressable>
          <CollapsibleTipContent
            expanded={form.tipExpanded}
            resetCount={form.tipResetCount}
          >
            <MoneyInput
              compact
              showCurrency
              inputRef={tipInput}
              label={t('tipInput')}
              hideLabel
              value={form.tip}
              error={tipError}
              disabled={disabled || !form.tipExpanded}
              onChange={raw => form.changeField('tip', raw)}
              onFocus={() => {
                entryNavigation?.focus('tip');
                tipFocused.current = true;
                form.focus('tip');
              }}
              onBlur={() => {
                entryNavigation?.blur('tip');
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
      </Card>
      <PaymentOutcome
        form={form}
        confirmLabel={confirmLabel}
        mode={mode}
        preferenceSaving={preferenceSaving}
        entryNavigation={entryNavigation}
      />
    </>
  );
}
