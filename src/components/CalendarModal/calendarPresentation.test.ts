import { compareCalendarMonths, isMonthInRange } from './calendarPresentation';

test('month comparison orders across years', () => {
  expect(
    compareCalendarMonths({ year: 2026, month: 12 }, { year: 2027, month: 1 }),
  ).toBeLessThan(0);
  expect(
    compareCalendarMonths({ year: 2026, month: 5 }, { year: 2026, month: 5 }),
  ).toBe(0);
});

test('range checks are inclusive and treat missing bounds as unbounded', () => {
  const min = { year: 2026, month: 3 };
  const max = { year: 2026, month: 11 };
  expect(isMonthInRange({ year: 2026, month: 3 }, min, max)).toBe(true);
  expect(isMonthInRange({ year: 2026, month: 11 }, min, max)).toBe(true);
  expect(isMonthInRange({ year: 2026, month: 2 }, min, max)).toBe(false);
  expect(isMonthInRange({ year: 2026, month: 12 }, min, max)).toBe(false);
  expect(isMonthInRange({ year: 1999, month: 1 }, null, max)).toBe(true);
  expect(isMonthInRange({ year: 2099, month: 1 }, min, undefined)).toBe(true);
});
