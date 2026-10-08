export const MAX_INPUT_CENTS = 999999;

export type AmountError =
  | 'notSafeInteger'
  | 'negative'
  | 'fareMustBePositive'
  | 'aboveMaximum';
export type MoneyParseResult =
  | { status: 'valid'; cents: number }
  | { status: 'draft'; cents: number }
  | { status: 'incomplete' }
  | { status: 'invalid'; reason: 'format' | 'aboveMaximum' };

export function validateAmountCents(
  cents: number,
  field: 'fare' | 'received',
): AmountError | null {
  if (!Number.isSafeInteger(cents)) {
    return 'notSafeInteger';
  }
  if (cents < 0) {
    return 'negative';
  }
  if (field === 'fare' && cents === 0) {
    return 'fareMustBePositive';
  }
  if (cents > MAX_INPUT_CENTS) {
    return 'aboveMaximum';
  }
  return null;
}

export function parseMoneyInput(
  raw: string,
  phase: 'editing' | 'blurred',
): MoneyParseResult {
  const input = raw.trim();
  if (input === '') {
    return { status: 'incomplete' };
  }
  if (!/^\d+(?:[,.]\d{0,2})?$/.test(input)) {
    return { status: 'invalid', reason: 'format' };
  }
  const [whole, fraction = ''] = input.split(/[,.]/);
  // Convert integer strings separately; never multiply decimal euros by 100.
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > MAX_INPUT_CENTS) {
    return { status: 'invalid', reason: 'aboveMaximum' };
  }
  if (phase === 'editing' && /[,.]$/.test(input)) {
    return { status: 'draft', cents };
  }
  return { status: 'valid', cents };
}
