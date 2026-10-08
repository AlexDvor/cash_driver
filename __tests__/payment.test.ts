import {
  applyExactAmount,
  applyQuickAmount,
  calculatePayment,
  changePaymentAmount,
  getQuickAmounts,
} from '../src/features/transactions/payment';
import { MAX_INPUT_CENTS } from '../src/features/transactions/money';

test.each([
  [2000, 2000, false, 0, 0, 2000],
  [2000, 5000, false, 3000, 0, 2000],
  [1800, 2000, true, 0, 200, 2000],
  [2000, 2000, true, 0, 0, 2000],
  [1, MAX_INPUT_CENTS, true, 0, MAX_INPUT_CENTS - 1, MAX_INPUT_CENTS],
])(
  'fare %i received %i tip %s',
  (
    fareAmountCents,
    cashReceivedCents,
    changeAsTip,
    changeGivenCents,
    tipCents,
    netCashCents,
  ) => {
    expect(
      calculatePayment({ fareAmountCents, cashReceivedCents, changeAsTip }),
    ).toEqual({ status: 'valid', changeGivenCents, tipCents, netCashCents });
  },
);

test.each([false, true])(
  'underpayment is insufficient even with tip=%s',
  changeAsTip => {
    expect(
      calculatePayment({
        fareAmountCents: 2450,
        cashReceivedCents: 2000,
        changeAsTip,
      }),
    ).toEqual({ status: 'insufficient', missingCents: 450 });
  },
);

test.each([0, -1, 1.1, NaN, Infinity, MAX_INPUT_CENTS + 1])(
  'invalid fare %s cannot produce valid payment',
  fareAmountCents => {
    expect(
      calculatePayment({
        fareAmountCents,
        cashReceivedCents: 5000,
        changeAsTip: false,
      }).status,
    ).toBe('invalid');
  },
);

test.each([-1, 1.1, NaN, Infinity, MAX_INPUT_CENTS + 1])(
  'invalid received %s cannot produce valid payment',
  cashReceivedCents => {
    expect(
      calculatePayment({
        fareAmountCents: 100,
        cashReceivedCents,
        changeAsTip: false,
      }).status,
    ).toBe('invalid');
  },
);

test('money invariants hold for exact/change/tip cases at small and maximum values', () => {
  const values = [1, 10, 99, 100, 1740, 20000, MAX_INPUT_CENTS];
  for (const fareAmountCents of values) {
    for (const cashReceivedCents of values) {
      for (const changeAsTip of [false, true]) {
        const result = calculatePayment({
          fareAmountCents,
          cashReceivedCents,
          changeAsTip,
        });
        if (cashReceivedCents < fareAmountCents) {
          expect(result.status).toBe('insufficient');
          continue;
        }
        if (result.status !== 'valid') {
          throw new Error('Valid amounts must calculate');
        }
        expect(result.netCashCents).toBe(fareAmountCents + result.tipCents);
        expect(cashReceivedCents).toBe(
          result.changeGivenCents + result.netCashCents,
        );
        expect(result.changeGivenCents).toBe(
          cashReceivedCents - fareAmountCents - result.tipCents,
        );
        for (const value of [
          result.changeGivenCents,
          result.tipCents,
          result.netCashCents,
        ]) {
          expect(Number.isSafeInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
        }
      }
    }
  }
});

test.each([
  [1, [500, 1000, 2000]],
  [500, [500, 1000, 2000]],
  [1740, [2000, 5000, 10000]],
  [2000, [2000, 5000, 10000]],
  [10001, [20000]],
  [20001, []],
  [MAX_INPUT_CENTS, []],
  [0, []],
  [-1, []],
  [NaN, []],
  [MAX_INPUT_CENTS + 1, []],
])('fare %s gets only available ascending quick values', (fare, expected) => {
  expect(getQuickAmounts(fare)).toEqual(expected);
});

test('quick selection replaces cash and resets a tip even for the same received amount', () => {
  const original = Object.freeze({
    fareAmountCents: 1800,
    cashReceivedCents: 2000,
    changeAsTip: true,
  });
  expect(applyQuickAmount(original, 5000)).toEqual({
    ...original,
    cashReceivedCents: 5000,
    changeAsTip: false,
  });
  expect(applyQuickAmount(original, 2000).changeAsTip).toBe(false);
  expect(original.changeAsTip).toBe(true);
  expect(() => applyQuickAmount(original, 1000)).toThrow(RangeError);
});

test('Exacto is available for every valid fare, including amounts above banknote suggestions', () => {
  for (const fareAmountCents of [1, 1740, 20001, MAX_INPUT_CENTS]) {
    const exact = applyExactAmount({
      fareAmountCents,
      cashReceivedCents: 5000,
      changeAsTip: true,
    });
    expect(exact).toEqual({
      fareAmountCents,
      cashReceivedCents: fareAmountCents,
      changeAsTip: false,
    });
    if (!exact) {
      throw new Error('Exact amount must exist for a valid fare');
    }
    expect(calculatePayment(exact)).toEqual({
      status: 'valid',
      changeGivenCents: 0,
      tipCents: 0,
      netCashCents: fareAmountCents,
    });
  }
  expect(
    applyExactAmount({
      fareAmountCents: 0,
      cashReceivedCents: 100,
      changeAsTip: true,
    }),
  ).toBeNull();
});

test('changing fare or received cents resets a tip without mutating its input', () => {
  const original = Object.freeze({
    fareAmountCents: 1800,
    cashReceivedCents: 2000,
    changeAsTip: true,
  });
  expect(changePaymentAmount(original, 'fareAmountCents', 1700)).toEqual({
    ...original,
    fareAmountCents: 1700,
    changeAsTip: false,
  });
  expect(changePaymentAmount(original, 'cashReceivedCents', 2100)).toEqual({
    ...original,
    cashReceivedCents: 2100,
    changeAsTip: false,
  });
  expect(
    changePaymentAmount(original, 'fareAmountCents', 1800).changeAsTip,
  ).toBe(true);
});
