import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { ActionButton } from './ActionButton';
import { palettes as mockPalettes } from '../../constants/theme/tokens';
import { View } from 'react-native';

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

test('optional icon follows destructive/disabled colors and yields to the loading indicator', async () => {
  const renderIcon = jest.fn(() => <View testID="button-icon" />);
  const onPress = jest.fn();
  const render = (disabled = false, loading = false) => (
    <ActionButton
      label="Delete"
      variant="destructive"
      renderIcon={renderIcon}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
    />
  );
  await act(async () => {
    app = Renderer.create(render());
  });
  expect(renderIcon).toHaveBeenLastCalledWith(mockPalettes.light.errorText);
  await act(async () => app.update(render(true)));
  expect(renderIcon).toHaveBeenLastCalledWith(mockPalettes.light.disabledText);
  renderIcon.mockClear();
  await act(async () => app.update(render(false, true)));
  expect(renderIcon).not.toHaveBeenCalled();
  expect(app.root.findAllByProps({ testID: 'button-icon' })).toHaveLength(0);
  expect(onPress).not.toHaveBeenCalled();
});
