import { NativeModules } from 'react-native';
export { version as packageVersion } from '../../../package.json';

export function readAppVersion(): { version: string; build: string } | null {
  try {
    const version: unknown = NativeModules.CashDriverAppVersion?.version;
    const build: unknown = NativeModules.CashDriverAppVersion?.build;
    if (
      typeof version === 'string' &&
      version &&
      typeof build === 'string' &&
      build
    ) {
      return { version, build };
    }
  } catch {
    // Missing native metadata is shown as unavailable, never as a guessed version.
  }
  return null;
}
