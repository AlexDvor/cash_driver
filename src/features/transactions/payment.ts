import { AmountError, validateAmountCents } from './money';
import { PaymentAmounts } from './types';

export type PaymentResult =
  | { status: 'invalid'; field: 'fare' | 'received'; reason: AmountError }
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
  const { fareAmountCents, cashReceivedCents, changeAsTip } = amounts;
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
  const tipCents = changeAsTip ? differenceCents : 0;
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
    changeAsTip: amounts[field] === cents && amounts.changeAsTip,
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
  return { ...amounts, cashReceivedCents: receivedCents, changeAsTip: false };
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
    changeAsTip: false,
  };
}
