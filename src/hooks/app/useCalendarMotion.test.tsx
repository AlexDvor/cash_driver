import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, AppState, AppStateStatus } from 'react-native';
import { useCalendarMotion } from './useCalendarMotion';

test('motion observes new accessibility preferences, app state and cleans up subscriptions', async () => {
  let resolve!: (value: boolean) => void;
  let preference!: (value: boolean) => void;
  let state!: (value: AppStateStatus) => void;
  const removePreference = jest.fn();
  const removeState = jest.fn();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
    new Promise<boolean>(done => {
      resolve = done;
    }),
  );
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_, listener) => {
      preference = listener as (value: boolean) => void;
      return { remove: removePreference };
    });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    state = listener;
    return { remove: removeState };
  });
  let current!: ReturnType<typeof useCalendarMotion>;
  function Probe() {
    current = useCalendarMotion();
    return null;
  }
  let app!: Renderer.ReactTestRenderer;
  try {
    await act(async () => {
      app = Renderer.create(<Probe />);
    });
    expect(current.reduced).toBe(true);
    await act(async () => {
      preference(true);
      resolve(false);
      state('background');
    });
    expect(current).toEqual({ reduced: true, active: false });
    await act(async () => {
      preference(false);
      state('active');
    });
    expect(current).toEqual({ reduced: false, active: true });
  } finally {
    await act(async () => {
      app?.unmount();
    });
    expect(removePreference).toHaveBeenCalledTimes(1);
    expect(removeState).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
  }
});
