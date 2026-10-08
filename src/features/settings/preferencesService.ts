import { createChangeNotifier } from '../../app/changeNotifier';
import {
  createPreferencesRepository,
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
        const preferences = { ...(await repository.read()), ...patch };
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
