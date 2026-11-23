import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useCountUp } from './useCountUp';

let seen: (number | null)[] = [];
function Probe({
  target,
  enabled,
}: {
  target: number | null;
  enabled: boolean;
}) {
  seen.push(useCountUp(target, enabled, 100));
  return null;
}

beforeEach(() => {
  seen = [];
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

test('is idle (null) when animation is disabled, so the real value is shown', async () => {
  await act(async () => {
    ReactTestRenderer.create(<Probe target={1000} enabled={false} />);
  });
  expect(seen.every(value => value === null)).toBe(true);
});

test('eases up to the target, then returns to idle', async () => {
  await act(async () => {
    ReactTestRenderer.create(<Probe target={1000} enabled />);
  });
  await act(async () => {
    jest.advanceTimersByTime(60);
  });
  const midway = seen.filter((value): value is number => value !== null);
  expect(midway.length).toBeGreaterThan(0);
  expect(Math.max(...midway)).toBeLessThan(1000);
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  expect(seen[seen.length - 1]).toBeNull();
});
