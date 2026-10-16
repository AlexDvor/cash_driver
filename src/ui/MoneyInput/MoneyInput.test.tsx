import React from 'react';
import { TextInput } from 'react-native';
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
