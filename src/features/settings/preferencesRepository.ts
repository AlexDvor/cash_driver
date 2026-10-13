import { SqlConnection } from '../../database/sqlite';
import { Language } from '../../i18n/translations';
import { ThemeMode } from '../../theme/resolveTheme';
import { Platform } from '../transactions/types';
import { isPlatform, platforms } from '../../constants/platforms';

export interface Preferences {
  language: Language;
  themeMode: ThemeMode;
  defaultPlatform: Platform;
  enabledPlatforms: Platform[];
  hapticsEnabled: boolean;
}

export function normalizeEnabledPlatforms(values: unknown): Platform[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid enabled platforms');
  }
  const unique = new Set<Platform>();
  for (const value of values) {
    if (!isPlatform(value) || unique.has(value)) {
      throw new Error('Invalid enabled platforms');
    }
    unique.add(value);
  }
  return platforms.filter(platform => unique.has(platform));
}

export function decodePreferences(
  row: Record<string, unknown>,
  enabledValues: unknown,
): Preferences {
  const {
    language,
    theme_mode: themeMode,
    default_platform: defaultPlatform,
    haptics_enabled: haptics,
  } = row;
  const enabledPlatforms = normalizeEnabledPlatforms(enabledValues);
  if (
    (language !== 'es' && language !== 'en' && language !== 'uk') ||
    (themeMode !== 'light' && themeMode !== 'dark' && themeMode !== 'system') ||
    !isPlatform(defaultPlatform) ||
    !enabledPlatforms.includes(defaultPlatform) ||
    (haptics !== 0 && haptics !== 1)
  ) {
    throw new Error('Corrupt preferences');
  }
  return {
    language,
    themeMode,
    defaultPlatform,
    enabledPlatforms,
    hapticsEnabled: haptics === 1,
  };
}

export function createPreferencesRepository(db: SqlConnection) {
  async function read(): Promise<Preferences> {
    let preferenceRow: Record<string, unknown> | undefined;
    let enabledValues: unknown[] = [];
    await db.transaction(async tx => {
      const preferences = await tx.execute(
        'SELECT * FROM preferences WHERE id = 1',
      );
      if (preferences.rows.length !== 1) {
        throw new Error('Preferences are missing');
      }
      preferenceRow = preferences.rows[0];
      const enabled = await tx.execute(
        'SELECT platform FROM preference_enabled_platforms WHERE preference_id = 1',
      );
      enabledValues = enabled.rows.map(row => row.platform);
    });
    if (!preferenceRow) {
      throw new Error('Preferences are missing');
    }
    return decodePreferences(preferenceRow, enabledValues);
  }
  return {
    read,
    async write(preferences: Preferences): Promise<void> {
      if (typeof preferences.hapticsEnabled !== 'boolean') {
        throw new Error('Invalid haptics preference');
      }
      const haptics = Number(preferences.hapticsEnabled);
      decodePreferences(
        {
          language: preferences.language,
          theme_mode: preferences.themeMode,
          default_platform: preferences.defaultPlatform,
          haptics_enabled: haptics,
        },
        preferences.enabledPlatforms,
      );
      await db.transaction(async tx => {
        const result = await tx.execute(
          'UPDATE preferences SET language = ?, theme_mode = ?, default_platform = ?, haptics_enabled = ? WHERE id = 1',
          [
            preferences.language,
            preferences.themeMode,
            preferences.defaultPlatform,
            haptics,
          ],
        );
        if (result.rowsAffected !== 1) {
          throw new Error('Preferences are missing');
        }
        await tx.execute(
          'DELETE FROM preference_enabled_platforms WHERE preference_id = 1',
        );
        for (const platform of preferences.enabledPlatforms) {
          await tx.execute(
            'INSERT INTO preference_enabled_platforms (preference_id, platform) VALUES (1, ?)',
            [platform],
          );
        }
      });
    },
  };
}
