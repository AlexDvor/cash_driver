import { groupHistory } from '../src/features/transactions/history';
import { CashTransaction } from '../src/features/transactions/types';

function record(
  id: string,
  createdAt: string,
  platform: CashTransaction['platform'] = 'uber',
): CashTransaction {
  return {
    id,
    createdAt,
    platform,
    fareAmountCents: 1000,
    cashReceivedCents: 2000,
    tipCents: 0,
    changeGivenCents: 1000,
    netCashCents: 1000,
    updatedAt: null,
  };
}
const now = new Date('2026-10-08T10:00:00Z');
test('filters combine and ordering uses descending timestamp and stable descending ID without mutating input', () => {
  const rows = [
    record('a', '2026-10-08T08:00:00Z'),
    record('z', '2026-10-08T08:00:00Z'),
    record('b', '2026-10-08T09:00:00Z', 'bolt'),
    record('c', '2026-10-07T23:00:00Z'),
  ];
  const groups = groupHistory(rows, 'day', 'uber', now, 'Europe/Madrid');
  expect(groups).toHaveLength(1);
  expect(groups[0].records.map(row => row.id)).toEqual(['z', 'a', 'c']);
  expect(rows.map(row => row.id)).toEqual(['a', 'z', 'b', 'c']);
  expect(groupHistory(rows, 'day', 'cabify', now, 'Europe/Madrid')).toEqual([]);
});
test('all groups by local date across UTC midnight and keeps newest dates first', () => {
  const rows = [
    record('a', '2026-10-07T21:59:59Z'),
    record('b', '2026-10-07T22:00:00Z'),
    record('c', '2026-10-08T00:00:00Z'),
  ];
  const groups = groupHistory(rows, 'all', 'all', now, 'Europe/Madrid');
  expect(groups.map(group => group.records.map(row => row.id))).toEqual([
    ['c', 'b'],
    ['a'],
  ]);
});
test('week starts Monday, month excludes previous month, all has no period bound', () => {
  const rows = [
    record('s', '2026-10-04T21:59:59Z'),
    record('m', '2026-10-04T22:00:00Z'),
    record('o', '2026-09-30T22:00:00Z'),
    record('p', '2026-09-30T21:59:59Z'),
  ];
  const ids = (period: 'week' | 'month' | 'all') =>
    groupHistory(rows, period, 'all', now, 'Europe/Madrid').flatMap(group =>
      group.records.map(row => row.id),
    );
  expect(ids('week')).toEqual(['m']);
  expect(ids('month')).toEqual(['m', 's', 'o']);
  expect(ids('all')).toEqual(['m', 's', 'o', 'p']);
});
test('DST repeated local hours stay ordered by UTC instants within the same local day', () => {
  const rows = [
    record('a', '2026-10-25T00:30:00Z'),
    record('b', '2026-10-25T01:30:00Z'),
  ];
  const groups = groupHistory(
    rows,
    'day',
    'all',
    new Date('2026-10-25T12:00:00Z'),
    'Europe/Madrid',
  );
  expect(groups).toHaveLength(1);
  expect(groups[0].records.map(row => row.id)).toEqual(['b', 'a']);
});
