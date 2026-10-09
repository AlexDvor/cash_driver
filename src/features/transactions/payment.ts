import { AmountError, validateAmountCents } from './money';
import { PaymentAmounts } from './types';

export type PaymentResult =
  | {
      status: 'invalid';
      field: 'fare' | 'received' | 'tip';
      reason: AmountError | 'exceedsAvailableChange';
    }
  | { status: 'insufficient'; missingCents: number }
  | {
      status: 'valid';
      changeGivenCents: number;
      tipCents: number;
      netCashCents: number;
    };

export function calculatePayment(
  amounts: Readonly<PaymentAmounts>,
): PaymentResult {
  const { fareAmountCents, cashReceivedCents, tipCents } = amounts;
  const fareError = validateAmountCents(fareAmountCents, 'fare');
  if (fareError) {
    return { status: 'invalid', field: 'fare', reason: fareError };
  }
  const receivedError = validateAmountCents(cashReceivedCents, 'received');
  if (receivedError) {
    return { status: 'invalid', field: 'received', reason: receivedError };
  }
  if (cashReceivedCents < fareAmountCents) {
    return {
      status: 'insufficient',
      missingCents: fareAmountCents - cashReceivedCents,
    };
  }
  const differenceCents = cashReceivedCents - fareAmountCents;
  const tipError = validateAmountCents(tipCents, 'tip');
  if (tipError) {
    return { status: 'invalid', field: 'tip', reason: tipError };
  }
  if (tipCents > differenceCents) {
    return {
      status: 'invalid',
      field: 'tip',
      reason: 'exceedsAvailableChange',
    };
  }
  const changeGivenCents = differenceCents - tipCents;
  return {
    status: 'valid',
    changeGivenCents,
    tipCents,
    netCashCents: fareAmountCents + tipCents,
  };
}

export function changePaymentAmount(
  amounts: Readonly<PaymentAmounts>,
  field: 'fareAmountCents' | 'cashReceivedCents',
  cents: number,
): PaymentAmounts {
  return {
    ...amounts,
    [field]: cents,
    tipCents: 0,
  };
}

const quickCandidates = [500, 1000, 2000, 5000, 10000, 20000];

export function getQuickAmounts(fareAmountCents: number): number[] {
  if (validateAmountCents(fareAmountCents, 'fare')) {
    return [];
  }
  return quickCandidates.filter(cents => cents >= fareAmountCents).slice(0, 3);
}

export function applyQuickAmount(
  amounts: Readonly<PaymentAmounts>,
  receivedCents: number,
): PaymentAmounts {
  if (!getQuickAmounts(amounts.fareAmountCents).includes(receivedCents)) {
    throw new RangeError(
      'Received amount is not an available quick suggestion',
    );
  }
  // A quick tap replaces cash, even when the value is unchanged, and clears tip.
  return { ...amounts, cashReceivedCents: receivedCents, tipCents: 0 };
}

export function applyExactAmount(
  amounts: Readonly<PaymentAmounts>,
): PaymentAmounts | null {
  if (validateAmountCents(amounts.fareAmountCents, 'fare')) {
    return null;
  }
  return {
    ...amounts,
    cashReceivedCents: amounts.fareAmountCents,
    tipCents: 0,
  };
}
