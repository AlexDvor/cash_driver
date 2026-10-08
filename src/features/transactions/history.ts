import {
  getPeriodBounds,
  isWithinPeriod,
  SummaryPeriod,
} from '../summary/periods';
import { CashTransaction, Platform } from './types';
export const platformLabels = {
  uber: 'Uber',
  cabify: 'Cabify',
  bolt: 'Bolt',
  other: 'Otro',
};

export type HistoryPeriod = SummaryPeriod | 'all';
export type HistoryPlatform = Platform | 'all';

export function localDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function groupHistory(
  records: readonly CashTransaction[],
  period: HistoryPeriod,
  platform: HistoryPlatform,
  now: Date,
  timeZone: string,
) {
  const bounds =
    period === 'all' ? null : getPeriodBounds(now, period, timeZone);
  const sorted = records
    .filter(
      record =>
        (platform === 'all' || record.platform === platform) &&
        (!bounds || isWithinPeriod(new Date(record.createdAt), bounds)),
    )
    .sort((left, right) => {
      const difference =
        Date.parse(right.createdAt) - Date.parse(left.createdAt);
      if (difference !== 0) {
        return difference;
      }
      return left.id === right.id ? 0 : left.id < right.id ? 1 : -1;
    });
  const groups: { key: string; date: Date; records: CashTransaction[] }[] = [];
  for (const record of sorted) {
    const date = new Date(record.createdAt);
    const key = localDateKey(date, timeZone);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.records.push(record);
    } else {
      groups.push({ key, date, records: [record] });
    }
  }
  return groups;
}
