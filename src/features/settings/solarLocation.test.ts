import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  hasSolarLocationPermission,
  requestSolarLocationPermission,
  watchSolarLocation,
} from './solarLocation';

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    setRNConfiguration: jest.fn(),
    watchPosition: jest.fn(() => 1),
    clearWatch: jest.fn(),
  },
}));

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  delete NativeModules.CashDriverLocationPermission;
});

test('permission checks do not request access or begin location updates', async () => {
  jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
  const request = jest.spyOn(PermissionsAndroid, 'request');
  expect(await hasSolarLocationPermission()).toBe(false);
  expect(request).not.toHaveBeenCalled();
  expect(Geolocation.watchPosition).not.toHaveBeenCalled();
});

test('explicit Android authorization requests approximate foreground location only', async () => {
  jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
  const request = jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue('granted');
  expect(await requestSolarLocationPermission()).toBe(true);
  expect(request).toHaveBeenCalledWith(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );
  request.mockResolvedValue('denied');
  expect(await requestSolarLocationPermission()).toBe(false);
});

test('iOS distinguishes status inspection from explicit when-in-use authorization', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const isAuthorized = jest.fn().mockResolvedValue(false);
  const requestAuthorization = jest.fn().mockResolvedValue(true);
  NativeModules.CashDriverLocationPermission = {
    isAuthorized,
    requestAuthorization,
  };
  expect(await hasSolarLocationPermission()).toBe(false);
  expect(requestAuthorization).not.toHaveBeenCalled();
  expect(await requestSolarLocationPermission()).toBe(true);
  expect(requestAuthorization).toHaveBeenCalledTimes(1);
  expect(Geolocation.watchPosition).not.toHaveBeenCalled();
});

test('missing native support and permission failures fall back without throwing', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  expect(await hasSolarLocationPermission()).toBe(false);
  expect(await requestSolarLocationPermission()).toBe(false);
  NativeModules.CashDriverLocationPermission = {
    isAuthorized: jest.fn().mockRejectedValue(new Error('unavailable')),
    requestAuthorization: jest.fn().mockRejectedValue(new Error('unavailable')),
  };
  expect(await requestSolarLocationPermission()).toBe(false);
});

test('watch is low-accuracy, has no background permission, and releases its subscription', () => {
  const onFix = jest.fn();
  const stop = watchSolarLocation(onFix, jest.fn());
  expect(Geolocation.setRNConfiguration).toHaveBeenCalledWith(
    expect.objectContaining({
      skipPermissionRequests: true,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: false,
    }),
  );
  const success = jest.mocked(Geolocation.watchPosition).mock.calls[0][0];
  success({
    coords: {
      latitude: 50,
      longitude: 30,
      altitude: null,
      accuracy: 100,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: 123,
  });
  expect(onFix).toHaveBeenCalledWith({
    latitude: 50,
    longitude: 30,
    timestamp: 123,
  });
  stop();
  expect(Geolocation.clearWatch).toHaveBeenCalledWith(1);
});
