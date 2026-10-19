import React from 'react';
import { TextInput, View, StyleSheet } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { MoneyInput } from './MoneyInput';
import { AppText } from '../AppText/AppText';
import { palettes as mockPalettes } from '../../constants/theme/tokens';

jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));

let app: Renderer.ReactTestRenderer;
afterEach(async () => {
  await act(async () => app?.unmount());
  jest.restoreAllMocks();
});

test('currency stays outside raw input and error color takes priority over focus', async () => {
  const onChange = jest.fn();
  const props = {
    label: 'Fare',
    showCurrency: true,
    value: '18',
    disabled: false,
    onChange,
    onFocus: jest.fn(),
    onBlur: jest.fn(),
  };
  await act(async () => {
    app = Renderer.create(<MoneyInput {...props} />);
  });
  const input = app.root.findByType(TextInput);
  const border = () =>
    StyleSheet.flatten(input.parent?.props.style).borderColor;
  await act(async () => input.props.onFocus());
  expect(border()).toBe(mockPalettes.light.primary);
  await act(async () => input.props.onChangeText('18.5'));
  expect(onChange).toHaveBeenCalledWith('18.5');
  const suffix = app.root
    .findAllByType(AppText)
    .find(node => node.props.children === '€');
  expect(suffix?.parent?.props.importantForAccessibility).toBe(
    'no-hide-descendants',
  );
  await act(async () => app.update(<MoneyInput {...props} error="Invalid" />));
  expect(border()).toBe(mockPalettes.light.errorText);
  expect(app.root.findAllByType(View).length).toBeGreaterThan(0);
});

test('hidden money label preserves the input accessible name and error hint', async () => {
  await act(async () => {
    app = Renderer.create(
      <MoneyInput
        label="Tip"
        hideLabel
        value=""
        error="Invalid"
        disabled={false}
        onChange={jest.fn()}
        onFocus={jest.fn()}
        onBlur={jest.fn()}
      />,
    );
  });
  expect(app.root.findByType(TextInput).props.accessibilityLabel).toBe('Tip');
  expect(app.root.findByType(TextInput).props.accessibilityHint).toBe(
    'Invalid',
  );
  expect(
    app.root.findAllByType(AppText).some(node => node.props.children === 'Tip'),
  ).toBe(false);
});
