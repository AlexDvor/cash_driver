import { createChangeNotifier } from '../../app/changeNotifier';
import {
  createPreferencesRepository,
  normalizeEnabledPlatforms,
  Preferences,
} from './preferencesRepository';

export function createPreferencesService(
  repository: ReturnType<typeof createPreferencesRepository>,
  changes: ReturnType<typeof createChangeNotifier>,
) {
  let queue: Promise<void> = Promise.resolve();
  return {
    read: repository.read,
    update(patch: Partial<Preferences>): Promise<Preferences> {
      // Serialize partial changes and read the latest committed values so a
      // language write cannot overwrite a concurrent theme/platform selection.
      const write = queue.then(async () => {
        const current = await repository.read();
        const preferences = { ...current, ...patch };
        if (patch.enabledPlatforms !== undefined) {
          preferences.enabledPlatforms = normalizeEnabledPlatforms(
            patch.enabledPlatforms,
          );
          if (
            patch.defaultPlatform === undefined &&
            !preferences.enabledPlatforms.includes(preferences.defaultPlatform)
          ) {
            preferences.defaultPlatform = preferences.enabledPlatforms[0];
          }
        }
        await repository.write(preferences);
        changes.notify('preferences');
        return preferences;
      });
      queue = write.then(
        () => {},
        () => {},
      );
      return write;
    },
  };
}
