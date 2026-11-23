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
import { Toggle } from '../../ui/Toggle/Toggle';
import CheckIcon from '../../assets/icons/line/check.svg';
import GiftIcon from '../../assets/icons/duotone/gift.svg';
import TrashIcon from '../../assets/icons/line/trash.svg';

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
    flexGrow: 0,
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
  // Visual "on" state of the tip switch: editor open or a valid tip applied.
  const tipActive = form.tipExpanded || positiveTip;
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
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.borderStrong,
                },
                pressed && styles.pressed,
              ]}
            >
              <PlatformIcon platform={platformOptions[0]} />
              <AppText>{platformLabels[platformOptions[0]]}</AppText>
              {form.platform === platformOptions[0] && (
                <CheckIcon
                  width={sizing.icon - 6}
                  height={sizing.icon - 6}
                  color={colors.primary}
                  accessible={false}
                />
              )}
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
                  form.receivedParsed.status === 'valid' &&
                  form.receivedParsed.cents === cents
                    ? [
                        styles.quickSelected,
                        {
                          borderColor: colors.primary,
                          backgroundColor: colors.softGreen,
                        },
                      ]
                    : {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceRaised,
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
                          ? colors.primary
                          : colors.text,
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
                    backgroundColor: colors.transparent,
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
              {
                borderColor: tipActive ? colors.primary : colors.border,
                backgroundColor: colors.surfaceRaised,
              },
              tipActive && styles.tipHeaderActive,
              (pressed || disabled) && styles.pressed,
            ]}
          >
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={[styles.tipPlate, { backgroundColor: colors.softGreen }]}
            >
              <GiftIcon
                width={sizing.icon - 4}
                height={sizing.icon - 4}
                color={colors.primary}
              />
            </View>
            <View style={styles.tipText}>
              <AppText style={styles.tipTitle}>{t('tipInput')}</AppText>
              {positiveTip && form.tipParsed.status === 'valid' ? (
                <AppText
                  testID="tip-amount-badge"
                  variant="supporting"
                  style={[styles.tipBadge, { color: colors.primary }]}
                >
                  {formatMoney(form.tipParsed.cents, locale)}
                </AppText>
              ) : (
                <AppText variant="supporting" secondary style={styles.tipHint}>
                  {t('optionalTip')}
                </AppText>
              )}
            </View>
            {/* Decorative switch mirrors the existing expand/collapse state. */}
            <Toggle value={tipActive} />
          </Pressable>
          <CollapsibleTipContent
            expanded={form.tipExpanded}
            resetCount={form.tipResetCount}
          >
            <View style={styles.tipEditor}>
              <View style={styles.tipField}>
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
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('removeTip')}
                accessibilityState={{
                  disabled: disabled || !form.tipExpanded,
                }}
                disabled={disabled || !form.tipExpanded}
                onPress={() => {
                  entryNavigation?.cancel();
                  form.removeTip();
                  finishTipFocus();
                }}
                style={({ pressed }) => [
                  styles.removeTip,
                  { backgroundColor: colors.errorSurface },
                  (pressed || disabled || !form.tipExpanded) && styles.pressed,
                ]}
              >
                <TrashIcon
                  width={sizing.icon - 2}
                  height={sizing.icon - 2}
                  color={colors.errorText}
                  accessible={false}
                />
              </Pressable>
            </View>
            {(() => {
              const allDisabled =
                disabled ||
                !form.tipExpanded ||
                form.availableChangeCents === null ||
                form.availableChangeCents === 0;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('allChangeAsTip')}
                  accessibilityState={{ disabled: allDisabled }}
                  disabled={allDisabled}
                  onPress={() => {
                    entryNavigation?.cancel();
                    form.allChangeAsTip();
                  }}
                  style={({ pressed }) => [
                    styles.quick,
                    styles.allChange,
                    {
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.card,
                    },
                    (pressed || allDisabled) && styles.pressed,
                  ]}
                >
                  <AppText style={styles.actionLabel}>
                    {t('allChangeAsTip')}
                  </AppText>
                  {form.availableChangeCents !== null &&
                    form.availableChangeCents > 0 && (
                      <AppText
                        variant="supporting"
                        style={[styles.actionAmount, { color: colors.primary }]}
                      >
                        {formatMoney(form.availableChangeCents, locale)}
                      </AppText>
                    )}
                </Pressable>
              );
            })()}
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
