import { summarizeTransactions } from '../src/features/summary/summary';
import { CashTransaction, Platform } from '../src/features/transactions/types';

function transaction(
  platform: Platform,
  fareAmountCents: number,
  tipCents = 0,
  changeGivenCents = 0,
): CashTransaction {
  return {
    id: 'fixture',
    platform,
    fareAmountCents,
    tipCents,
    changeGivenCents,
    cashReceivedCents: fareAmountCents + tipCents + changeGivenCents,
    netCashCents: fareAmountCents + tipCents,
    createdAt: '2026-10-08T12:00:00.000Z',
    updatedAt: null,
  };
}

test('empty summary gives explicit zero totals for every platform', () => {
  expect(summarizeTransactions([])).toEqual({
    operationCount: 0,
    fareTotalCents: 0,
    tipTotalCents: 0,
    netCashTotalCents: 0,
    averageFareCents: 0,
    fareByPlatformCents: { uber: 0, cabify: 0, bolt: 0, other: 0 },
  });
});

test('mixed records separate fare, tips, retained cash, and platform totals without mutating data', () => {
  const records = Object.freeze([
    Object.freeze(transaction('uber', 2000, 0, 3000)),
    Object.freeze(transaction('cabify', 1800, 200)),
    Object.freeze(transaction('bolt', 1050)),
    Object.freeze(transaction('uber', 100)),
    Object.freeze(transaction('other', 200)),
  ]);
  expect(summarizeTransactions(records)).toEqual({
    operationCount: 5,
    fareTotalCents: 5150,
    tipTotalCents: 200,
    netCashTotalCents: 5350,
    averageFareCents: 1030,
    fareByPlatformCents: { uber: 2100, cabify: 1800, bolt: 1050, other: 200 },
  });
  expect(records[0].cashReceivedCents).toBe(5000);
});

test.each([
  [[100, 101], 101],
  [[100, 100, 101], 100],
  [[100, 101, 101], 101],
  [[1, 2], 2],
  [[999999], 999999],
])(
  'rounds average fare from %j to %i cents with integer quotient/remainder',
  (fares, expected) => {
    expect(
      summarizeTransactions(fares.map(fare => transaction('uber', fare)))
        .averageFareCents,
    ).toBe(expected);
  },
);

test('summary rejects corrupt stored arithmetic rather than displaying fabricated totals', () => {
  const record = transaction('uber', 1800, 200);
  for (const patch of [
    { netCashCents: 2200 },
    { tipCents: 100 },
    { changeGivenCents: 0.5 },
    { fareAmountCents: 0 },
    { cashReceivedCents: 999999 + 1 },
    { tipCents: NaN },
  ]) {
    expect(() => summarizeTransactions([{ ...record, ...patch }])).toThrow(
      RangeError,
    );
  }
});
