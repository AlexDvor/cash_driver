import {
  solarThemeTiming,
  solarLocationOptions,
} from '../../constants/solarTheme';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { SolarCoordinates } from '../../theme/solarTheme';

export interface SolarLocationFix extends SolarCoordinates {
  timestamp: number;
}

// Load lazily so an old installed binary can still use the system-theme fallback.
function locationApi() {
  const module: typeof import('@react-native-community/geolocation') = require('@react-native-community/geolocation');
  const api = module.default;
  api.setRNConfiguration({
    skipPermissionRequests: true,
    authorizationLevel: 'whenInUse',
    enableBackgroundLocationUpdates: false,
    // Prefer fused approximate fixes on Android; the library falls back to
    // LocationManager on devices without Play Services.
    locationProvider: 'playServices',
  });
  return api;
}

export async function hasSolarLocationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
    }
    if (Platform.OS === 'ios') {
      const permission: { isAuthorized: () => Promise<boolean> } | undefined =
        NativeModules.CashDriverLocationPermission;
      return (await permission?.isAuthorized()) ?? false;
    }
  } catch {
    /* Permission/native availability failures use system appearance. */
  }
  return false;
}

/** Called only by an explicit Automatic selection, never by startup/resume. */
export async function requestSolarLocationPermission(): Promise<boolean> {
  try {
    if (await hasSolarLocationPermission()) return true;
    if (Platform.OS === 'android') {
      return (
        (await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        )) === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    if (Platform.OS === 'ios') {
      return await new Promise<boolean>(resolve => {
        const timeout = setTimeout(
          () => resolve(false),
          solarThemeTiming.iosPermissionTimeoutMs,
        );
        const finish = (granted: boolean) => {
          clearTimeout(timeout);
          resolve(granted);
        };
        try {
          const permission:
            | { requestAuthorization: () => Promise<boolean> }
            | undefined = NativeModules.CashDriverLocationPermission;
          if (!permission) finish(false);
          else
            permission.requestAuthorization().then(finish, () => finish(false));
        } catch {
          finish(false);
        }
      });
    }
  } catch {
    /* Denial and unavailable native modules are non-fatal. */
  }
  return false;
}

/** The caller owns this foreground-only watch and must release it on inactivity. */
export function watchSolarLocation(
  onFix: (fix: SolarLocationFix) => void,
  onUnavailable: (permissionDenied: boolean) => void,
): () => void {
  const api = locationApi();
  const watch = api.watchPosition(
    position =>
      onFix({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
      }),
    error => onUnavailable(error.code === 1),
    solarLocationOptions,
  );
  return () => api.clearWatch(watch);
}
