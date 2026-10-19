import { AppState, NativeModules, Platform } from 'react-native';
import { confirmationSound } from './confirmationSound';

const originalState = AppState.currentState;
const play = jest.fn();
beforeEach(() => {
  AppState.currentState = 'active';
  NativeModules.CashDriverConfirmationSound = { play };
  play.mockReset();
});
afterEach(() => {
  AppState.currentState = originalState;
  delete NativeModules.CashDriverConfirmationSound;
  jest.restoreAllMocks();
});
test('plays only when enabled, supported and foregrounded', () => {
  confirmationSound(false);
  expect(play).not.toHaveBeenCalled();
  confirmationSound(true);
  expect(play).toHaveBeenCalledTimes(1);
  AppState.currentState = 'background';
  confirmationSound(true);
  expect(play).toHaveBeenCalledTimes(1);
});
test('missing or failing audio never throws after a committed save', () => {
  delete NativeModules.CashDriverConfirmationSound;
  expect(() => confirmationSound(true)).not.toThrow();
  NativeModules.CashDriverConfirmationSound = {
    play: () => {
      throw new Error('No audio device');
    },
  };
  expect(() => confirmationSound(true)).not.toThrow();
});
test('unsupported platforms do not play', () => {
  jest.replaceProperty(Platform, 'OS', 'windows');
  confirmationSound(true);
  expect(play).not.toHaveBeenCalled();
});
