import React from 'react';
import { Keyboard } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { useKeyboardVisible } from './useKeyboardVisible';
import { palettes as mockPalettes } from '../../constants/theme/tokens';

jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));

let app: Renderer.ReactTestRenderer;
afterEach(async () => {
  await act(async () => app?.unmount());
  jest.restoreAllMocks();
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
