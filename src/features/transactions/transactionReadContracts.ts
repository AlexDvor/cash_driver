import { PeriodBounds } from '../summary/periods';
import { CashTransaction, Platform } from './types';

// A bounded transfer size, not a capacity or latency guarantee.
export const HISTORY_PAGE_SIZE = 50;

export interface HistoryReadFilter {
  bounds?: Readonly<PeriodBounds>;
  platform?: Platform;
}

export interface HistoryCursor {
  readonly createdAt: string;
  readonly id: string;
  readonly queryKey: string;
  readonly revision: number;
}

export interface HistoryPageRequest extends HistoryReadFilter {
  cursor?: Readonly<HistoryCursor>;
  pageSize?: number;
}

export interface HistoryPage {
  records: CashTransaction[];
  nextCursor: HistoryCursor | null;
}
