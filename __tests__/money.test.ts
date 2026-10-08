import {
  MAX_INPUT_CENTS,
  parseMoneyInput,
  validateAmountCents,
} from '../src/features/transactions/money';

test.each([
  ['20', 2000],
  ['20,5', 2050],
  ['20,50', 2050],
  ['20.50', 2050],
  ['0,10', 10],
  ['0', 0],
  [' 20.50 \n', 2050],
  ['00020,05', 2005],
  ['9999,99', MAX_INPUT_CENTS],
])('parses %s without decimal euro arithmetic', (raw, cents) => {
  expect(parseMoneyInput(raw, 'editing')).toEqual({ status: 'valid', cents });
});

test.each(['', ' \t\n'])('empty %j is incomplete', raw => {
  expect(parseMoneyInput(raw, 'editing')).toEqual({ status: 'incomplete' });
});

test.each(['20,', '20.'])(
  'trailing decimal %s is a focused draft until blur',
  raw => {
    expect(parseMoneyInput(raw, 'editing')).toEqual({
      status: 'draft',
      cents: 2000,
    });
    expect(parseMoneyInput(raw, 'blurred')).toEqual({
      status: 'valid',
      cents: 2000,
    });
  },
);

test.each([
  '20,555',
  '1,2.3',
  '-5',
  'letters',
  '+20',
  '1e2',
  '.50',
  ',50',
  '1 000',
  '1.000,00',
  '1,000.00',
  '20 €',
  'NaN',
  'Infinity',
  '20\n50',
  '２０',
])('rejects malformed %j', raw => {
  expect(parseMoneyInput(raw, 'blurred')).toEqual({
    status: 'invalid',
    reason: 'format',
  });
});

test.each(['10000', '10000,00', '99999999999999999999999999', '9999,999'])(
  'rejects input above the bound or precision: %s',
  raw => {
    expect(parseMoneyInput(raw, 'editing').status).toBe('invalid');
  },
);

test.each([NaN, Infinity, -Infinity, 0.1, Number.MAX_SAFE_INTEGER + 1])(
  'rejects unsafe/noninteger cents %s',
  cents => {
    expect(validateAmountCents(cents, 'received')).toBe('notSafeInteger');
  },
);

test('validates both input fields including zero and maximum', () => {
  expect(validateAmountCents(-1, 'received')).toBe('negative');
  expect(validateAmountCents(0, 'fare')).toBe('fareMustBePositive');
  expect(validateAmountCents(0, 'received')).toBeNull();
  expect(validateAmountCents(1, 'fare')).toBeNull();
  for (const field of ['fare', 'received'] as const) {
    expect(validateAmountCents(MAX_INPUT_CENTS, field)).toBeNull();
    expect(validateAmountCents(MAX_INPUT_CENTS + 1, field)).toBe(
      'aboveMaximum',
    );
  }
});
