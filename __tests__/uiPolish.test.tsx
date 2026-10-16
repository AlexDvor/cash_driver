import React from 'react';
import { Keyboard, TextInput } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { ActionButton } from '../src/ui/ActionButton/ActionButton';
import { MoneyInput } from '../src/ui/MoneyInput/MoneyInput';
import { AppText } from '../src/ui/AppText/AppText';
import { useKeyboardVisible } from '../src/hooks/app/useKeyboardVisible';
import { palettes as mockPalettes } from '../src/constants/theme/tokens';

jest.mock('../src/providers/ThemeProvider/ThemeProvider', () => ({
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

test('keyboard action follows native visibility and removes listeners on unmount', async () => {
  const listeners = new Map<string, () => void>();
  const remove = jest.fn();
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
    listeners.set(event, listener as () => void);
    return { remove };
  });
  function Harness() {
    const visible = useKeyboardVisible();
    return visible ? (
      <ActionButton label="Hide keyboard" onPress={Keyboard.dismiss} />
    ) : null;
  }
  await act(async () => {
    app = Renderer.create(<Harness />);
  });
  expect(app.root.findAllByType(ActionButton)).toHaveLength(0);
  await act(async () => listeners.get('keyboardDidShow')!());
  expect(app.root.findAllByType(ActionButton)).toHaveLength(1);
  await act(async () => listeners.get('keyboardDidHide')!());
  expect(app.root.findAllByType(ActionButton)).toHaveLength(0);
  await act(async () => app.unmount());
  expect(remove).toHaveBeenCalledTimes(2);
});
