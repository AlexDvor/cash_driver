import { Platform } from 'react-native';
import { confirmationHaptics } from './confirmationHaptics';
jest.mock('react-native-haptic-feedback', () => ({
  isSupported: jest.fn(() => true),
  trigger: jest.fn(),
  triggerPattern: jest.fn(),
}));
const native = jest.requireMock('react-native-haptic-feedback') as {
  isSupported: jest.Mock;
  trigger: jest.Mock;
  triggerPattern: jest.Mock;
};
beforeEach(() => {
  native.isSupported.mockReset().mockReturnValue(true);
  native.trigger.mockReset();
  native.triggerPattern.mockReset();
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
  expect(native.triggerPattern).not.toHaveBeenCalled();
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
  'Android API %s uses system-controlled success vibration',
  api => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(api);
    confirmationHaptics(true);
    expect(native.triggerPattern).toHaveBeenCalledWith(
      [{ time: 0, type: 'continuous', duration: 500, intensity: 1 }],
      {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      },
    );
    expect(native.trigger).not.toHaveBeenCalled();
  },
);
test('capability/trigger errors never escape', () => {
  native.isSupported.mockImplementationOnce(() => {
    throw Error('unsupported native');
  });
  expect(() => confirmationHaptics(true)).not.toThrow();
  native.triggerPattern.mockImplementation(() => {
    throw Error('pattern failed');
  });
  expect(() => confirmationHaptics(true)).not.toThrow();
  native.trigger.mockImplementation(() => {
    throw Error('feedback failed');
  });
  expect(() => confirmationHaptics(true)).not.toThrow();
});
