import type { Platform } from '../../constants/platforms';

export type { Platform } from '../../constants/platforms';

export interface CashTransaction {
  id: string; // One UUID per pending operation; unchanged draft retries reuse it.
  platform: Platform;
  fareAmountCents: number;
  cashReceivedCents: number;
  changeGivenCents: number;
  tipCents: number;
  netCashCents: number;
  createdAt: string; // Original confirmation time, UTC ISO 8601.
  updatedAt: string | null;
}

export interface PaymentAmounts {
  fareAmountCents: number;
  cashReceivedCents: number;
  changeAsTip: boolean;
}
