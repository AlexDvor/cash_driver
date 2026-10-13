import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Animated } from 'react-native';
import { UndoCountdownButton } from '../src/components/DeletionNotice/UndoCountdownButton';

jest.mock('../src/providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({
    colors: require('../src/constants/theme/tokens').palettes.light,
  }),
}));

test('uses the existing deadline, shows only the undo label, and stops animation on unmount', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(3000);
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const stop = jest.fn();
  const timing = jest
    .spyOn(Animated, 'timing')
    .mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() });
  const undo = jest.fn();
  let app: Renderer.ReactTestRenderer;
  try {
    await act(async () => {
      app = Renderer.create(
        <UndoCountdownButton
          label="Deshacer"
          expiresAt={10000}
          onPress={undo}
        />,
      );
    });
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        duration: 7000,
        toValue: 0,
        useNativeDriver: true,
      }),
    );
    const button = app!.root.find(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );
    expect(button.props.accessibilityLabel).toBe('Deshacer');
    const fill = app!.root.findByProps({ testID: 'undo-countdown-fill' });
    expect(fill.props.pointerEvents).toBe('none');
    await act(async () => button.props.onPress());
    expect(undo).toHaveBeenCalledTimes(1);
    await act(async () => app!.unmount());
    expect(stop).toHaveBeenCalledTimes(1);
  } finally {
    jest.restoreAllMocks();
    jest.useRealTimers();
  }
});
