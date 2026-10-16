import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Animated, AppState } from 'react-native';
import { useSkeletonPulse } from '../src/hooks/app/useSkeletonPulse';

function Probe({ loading }: { loading: boolean }) {
  useSkeletonPulse(loading);
  return null;
}

afterEach(() => jest.restoreAllMocks());

test('pulse uses the native driver without blocking interactions and stops on ready/background/unmount', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  let stateChange!: (state: 'active' | 'background') => void;
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    stateChange = listener;
    return { remove };
  });
  const timing = jest.spyOn(Animated, 'timing');
  const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
  const loop = jest.spyOn(Animated, 'loop').mockReturnValue(animation);
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(<Probe loading />);
  });
  await act(async () => stateChange('active'));
  expect(loop).toHaveBeenCalled();
  expect(
    timing.mock.calls.every(
      ([, config]) => config.useNativeDriver && config.isInteraction === false,
    ),
  ).toBe(true);
  await act(async () => stateChange('background'));
  expect(animation.stop).toHaveBeenCalled();
  loop.mockClear();
  await act(async () => app.update(<Probe loading={false} />));
  await act(async () => stateChange('active'));
  expect(loop).not.toHaveBeenCalled();
  await act(async () => app.update(<Probe loading />));
  expect(loop).toHaveBeenCalled();
  animation.stop.mockClear();
  await act(async () => app.unmount());
  expect(animation.stop).toHaveBeenCalled();
  expect(remove).toHaveBeenCalled();
});

test('new Reduce Motion event wins over a stale initial preference response', async () => {
  let resolve!: (enabled: boolean) => void;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
    new Promise<boolean>(done => {
      resolve = done;
    }),
  );
  let preferenceChange!: (enabled: boolean) => void;
  const remove = jest.fn();
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_, listener) => {
      preferenceChange = listener as (enabled: boolean) => void;
      return { remove };
    });
  const loop = jest.spyOn(Animated, 'loop');
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(<Probe loading />);
  });
  await act(async () => {
    preferenceChange(true);
    resolve(false);
  });
  expect(loop).not.toHaveBeenCalled();
  await act(async () => app.unmount());
  expect(remove).toHaveBeenCalled();
});
