import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

test('motion stays off until resolved, follows live changes and ignores a stale initial response', async () => {
  let resolve!: (value: boolean) => void;
  let change!: (value: boolean) => void;
  const remove = jest.fn();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
    new Promise<boolean>(done => {
      resolve = done;
    }),
  );
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_, listener) => {
      change = listener;
      return { remove };
    });
  let reduced = false;
  function Probe() {
    reduced = useReducedMotion();
    return null;
  }
  let app!: Renderer.ReactTestRenderer;
  try {
    await act(async () => {
      app = Renderer.create(<Probe />);
    });
    expect(reduced).toBe(true);
    await act(async () => {
      change(true);
      resolve(false);
    });
    expect(reduced).toBe(true);
    await act(async () => {
      change(false);
    });
    expect(reduced).toBe(false);
  } finally {
    await act(async () => app?.unmount());
    expect(remove).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
  }
});
