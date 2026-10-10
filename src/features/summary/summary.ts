import { CashTransaction, Platform } from '../transactions/types';
import { platforms } from '../../constants/platforms';
import { calculatePayment } from '../transactions/payment';

export interface CashSummary {
  operationCount: number;
  fareTotalCents: number;
  tipTotalCents: number;
  netCashTotalCents: number;
  averageFareCents: number;
  fareByPlatformCents: Record<Platform, number>;
}

function addCents(total: number, cents: number): number {
  const sum = total + cents;
  if (!Number.isSafeInteger(sum)) {
    throw new RangeError('Summary total exceeds safe integer cents');
  }
  return sum;
}

export function averageFareCents(
  fareTotalCents: number,
  operationCount: number,
): number {
  if (
    !Number.isSafeInteger(fareTotalCents) ||
    fareTotalCents < 0 ||
    !Number.isSafeInteger(operationCount) ||
    operationCount < 0
  ) {
    throw new RangeError('Invalid summary total or count');
  }
  if (operationCount === 0) {
    return 0;
  }
  const quotient = Math.floor(fareTotalCents / operationCount);
  const remainder = fareTotalCents % operationCount;
  return quotient + (remainder >= Math.ceil(operationCount / 2) ? 1 : 0);
}

// Pass records already selected for the requested period/platform. No clock,
// filtering state, persistence, or UI is consulted by this calculation.
export function summarizeTransactions(
  transactions: readonly Readonly<CashTransaction>[],
): CashSummary {
  const summary: CashSummary = {
    operationCount: transactions.length,
    fareTotalCents: 0,
    tipTotalCents: 0,
    netCashTotalCents: 0,
    averageFareCents: 0,
    fareByPlatformCents: { uber: 0, cabify: 0, bolt: 0, other: 0 },
  };
  for (const transaction of transactions) {
    const payment = calculatePayment({
      ...transaction,
    });
    if (
      !platforms.includes(transaction.platform) ||
      payment.status !== 'valid' ||
      payment.tipCents !== transaction.tipCents ||
      payment.changeGivenCents !== transaction.changeGivenCents ||
      payment.netCashCents !== transaction.netCashCents
    ) {
      throw new RangeError('Invalid transaction monetary values or platform');
    }
    summary.fareTotalCents = addCents(
      summary.fareTotalCents,
      transaction.fareAmountCents,
    );
    summary.tipTotalCents = addCents(
      summary.tipTotalCents,
      transaction.tipCents,
    );
    summary.netCashTotalCents = addCents(
      summary.netCashTotalCents,
      transaction.netCashCents,
    );
    summary.fareByPlatformCents[transaction.platform] = addCents(
      summary.fareByPlatformCents[transaction.platform],
      transaction.fareAmountCents,
    );
  }
  // Share exact integer rounding with compact SQL summaries.
  summary.averageFareCents = averageFareCents(
    summary.fareTotalCents,
    summary.operationCount,
  );
  return summary;
}
