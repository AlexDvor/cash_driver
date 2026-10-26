import React, { useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { useKeyboardVisible } from '../../hooks/app/useKeyboardVisible';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { formatMoney } from '../../i18n/formatting';
import type { PaymentOutcomeProps } from './PaymentOutcome.interface';
import { styles } from './PaymentOutcome.styles';
import { CashIcon, ReceiptSurface } from './ReceiptSurface';
import { CollapsibleContent } from '../CollapsibleContent/CollapsibleContent';

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
  const emptyDraft =
    form.fare.trim() === '' &&
    form.received.trim() === '' &&
    form.tip.trim() === '';
  const [receiptSize, setReceiptSize] = useState({ width: 0, height: 0 });
  const [dividerY, setDividerY] = useState(0);
  const receiptColor =
    result?.status === 'insufficient'
      ? colors.errorSurface
      : result?.status === 'valid'
      ? colors.softGreen
      : colors.card;
  return (
    <View
      ref={outcomeRef}
      collapsable={false}
      onLayout={onLayout}
      testID="payment-outcome"
    >
      <View style={styles.card}>
        <View
          style={styles.result}
          onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            setReceiptSize({ width, height });
          }}
        >
          <ReceiptSurface
            {...receiptSize}
            dividerY={result?.status === 'valid' ? dividerY : 0}
            fill={receiptColor}
          />
          <View style={styles.receiptHeading}>
            <CashIcon
              color={
                result?.status === 'insufficient'
                  ? colors.errorText
                  : colors.primary
              }
            />
            <AppText style={styles.receiptTitle}>{t('changeToReturn')}</AppText>
          </View>
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
              : emptyDraft
              ? formatMoney(0, locale)
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
          {result?.status === 'valid' &&
            form.fareParsed.status === 'valid' &&
            form.receivedParsed.status === 'valid' && (
              <View
                testID="payment-receipt-details"
                onLayout={event => setDividerY(event.nativeEvent.layout.y)}
                style={[styles.details, { borderTopColor: colors.border }]}
              >
                {[
                  {
                    id: 'fare',
                    label: t('receiptFare'),
                    cents: form.fareParsed.cents,
                  },
                  {
                    id: 'received',
                    label: t('receiptReceived'),
                    cents: form.receivedParsed.cents,
                  },
                  ...(result.tipCents > 0
                    ? [
                        {
                          id: 'tip',
                          label: t('tipInput'),
                          cents: result.tipCents,
                        },
                      ]
                    : []),
                ].map(row => (
                  <View key={row.id} style={styles.detailRow}>
                    <AppText
                      variant="supporting"
                      secondary
                      style={styles.detailLabel}
                    >
                      {row.label}
                    </AppText>
                    <AppText
                      testID={`receipt-${row.id}`}
                      style={styles.detailValue}
                    >
                      {formatMoney(row.cents, locale)}
                    </AppText>
                  </View>
                ))}
              </View>
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
        <View>
          <ActionButton
            depth
            renderIcon={color => (
              <AppText
                accessible={false}
                importantForAccessibility="no"
                style={{ color }}
              >
                ✓
              </AppText>
            )}
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
          {mode === 'create' && (
            <CollapsibleContent
              expanded={form.availableChangeCents !== null}
              resetCount={0}
              testID="cancel-payment-section"
            >
              <View style={styles.cancelContent}>
                <ActionButton
                  label={t('cancelPayment')}
                  variant="outline"
                  disabled={
                    form.saving ||
                    preferenceSaving ||
                    form.availableChangeCents === null
                  }
                  onPress={() => {
                    entryNavigation?.cancel();
                    if (form.cancelPayment()) Keyboard.dismiss();
                  }}
                />
              </View>
            </CollapsibleContent>
          )}
        </View>
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
      </View>
    </View>
  );
}
