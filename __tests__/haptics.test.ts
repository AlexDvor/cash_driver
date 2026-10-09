import { Platform } from 'react-native';
import { confirmationHaptics } from '../src/features/settings/confirmationHaptics';
jest.mock('react-native-haptic-feedback', () => ({
  isSupported: jest.fn(() => true),
  trigger: jest.fn(),
}));
const native = jest.requireMock('react-native-haptic-feedback') as {
  isSupported: jest.Mock;
  trigger: jest.Mock;
};
beforeEach(() => {
  native.isSupported.mockReset().mockReturnValue(true);
  native.trigger.mockReset();
});
afterEach(() => {
  jest.restoreAllMocks();
});
test('disabled and unsupported device are no-ops', () => {
  confirmationHaptics(false);
  expect(native.isSupported).not.toHaveBeenCalled();
  native.isSupported.mockReturnValue(false);
  confirmationHaptics(true);
  expect(native.trigger).not.toHaveBeenCalled();
});
test('iOS feedback avoids vibrate fallback and respects native settings', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  confirmationHaptics(true);
  expect(native.trigger).toHaveBeenCalledWith('notificationSuccess', {
    enableVibrateFallback: false,
    ignoreAndroidSystemSettings: false,
  });
});
test.each([29, 36])(
  'Android API %s uses system-controlled view feedback',
  api => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(api);
    confirmationHaptics(true);
    expect(native.trigger).toHaveBeenCalledWith(
      api >= 30 ? 'confirm' : 'virtualKey',
      { enableVibrateFallback: false, ignoreAndroidSystemSettings: false },
    );
  },
);
test('capability/trigger errors never escape', () => {
  native.isSupported.mockImplementationOnce(() => {
    throw Error('unsupported native');
  });
  expect(() => confirmationHaptics(true)).not.toThrow();
  native.trigger.mockImplementation(() => {
    throw Error('feedback failed');
  });
  expect(() => confirmationHaptics(true)).not.toThrow();
});
