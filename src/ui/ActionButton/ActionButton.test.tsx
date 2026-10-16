import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { ActionButton } from './ActionButton';
import { palettes as mockPalettes } from '../../constants/theme/tokens';

jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));

let app: Renderer.ReactTestRenderer;
afterEach(async () => {
  await act(async () => app?.unmount());
  jest.restoreAllMocks();
});

test('loading blocks button activation and exposes busy and disabled states', async () => {
  const onPress = jest.fn();
  await act(async () => {
    app = Renderer.create(
      <ActionButton label="Save" loading onPress={onPress} />,
    );
  });
  const button = app.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function',
  )[0];
  expect(button.props.disabled).toBe(true);
  expect(button.props.accessibilityState).toEqual({
    disabled: true,
    busy: true,
  });
});
