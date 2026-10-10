import { CashTransaction } from './types';
import { calculatePayment } from './payment';
import { isPlatform } from '../../constants/platforms';

export function decodeTransaction(
  row: Record<string, unknown>,
): CashTransaction {
  const {
    id,
    platform,
    fare_amount_cents: fareAmountCents,
    cash_received_cents: cashReceivedCents,
    change_given_cents: changeGivenCents,
    tip_cents: tipCents,
    net_cash_cents: netCashCents,
    created_at: createdAt,
    updated_at: updatedAt,
  } = row;
  if (
    typeof id !== 'string' ||
    !isPlatform(platform) ||
    typeof fareAmountCents !== 'number' ||
    typeof cashReceivedCents !== 'number' ||
    typeof changeGivenCents !== 'number' ||
    typeof tipCents !== 'number' ||
    typeof netCashCents !== 'number' ||
    typeof createdAt !== 'string' ||
    (updatedAt !== null && typeof updatedAt !== 'string')
  ) {
    throw new Error('Invalid transaction row');
  }
  const payment = calculatePayment({
    fareAmountCents,
    cashReceivedCents,
    tipCents,
  });
  if (
    payment.status !== 'valid' ||
    payment.tipCents !== tipCents ||
    payment.changeGivenCents !== changeGivenCents ||
    payment.netCashCents !== netCashCents ||
    !Number.isFinite(Date.parse(createdAt)) ||
    (updatedAt !== null && !Number.isFinite(Date.parse(updatedAt)))
  ) {
    throw new Error('Corrupt transaction values');
  }
  return {
    id,
    platform,
    fareAmountCents,
    cashReceivedCents,
    changeGivenCents,
    tipCents,
    netCashCents,
    createdAt,
    updatedAt,
  };
}
