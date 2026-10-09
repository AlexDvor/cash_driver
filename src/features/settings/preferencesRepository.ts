import { SqlConnection } from '../../database/sqlite';
import { Language } from '../../i18n/translations';
import { ThemeMode } from '../../theme/resolveTheme';
import { Platform } from '../transactions/types';

export interface Preferences {
  language: Language;
  themeMode: ThemeMode;
  defaultPlatform: Platform;
  hapticsEnabled: boolean;
}

export function decodePreferences(row: Record<string, unknown>): Preferences {
  const {
    language,
    theme_mode: themeMode,
    default_platform: defaultPlatform,
    haptics_enabled: haptics,
  } = row;
  if (
    (language !== 'es' && language !== 'en' && language !== 'uk') ||
    (themeMode !== 'light' && themeMode !== 'dark' && themeMode !== 'system') ||
    (defaultPlatform !== 'uber' &&
      defaultPlatform !== 'cabify' &&
      defaultPlatform !== 'bolt' &&
      defaultPlatform !== 'other') ||
    (haptics !== 0 && haptics !== 1)
  ) {
    throw new Error('Corrupt preferences');
  }
  return {
    language,
    themeMode,
    defaultPlatform,
    hapticsEnabled: haptics === 1,
  };
}

export function createPreferencesRepository(db: SqlConnection) {
  async function read(): Promise<Preferences> {
    const result = await db.execute('SELECT * FROM preferences WHERE id = 1');
    if (result.rows.length !== 1) {
      throw new Error('Preferences are missing');
    }
    return decodePreferences(result.rows[0]);
  }
  return {
    read,
    async write(preferences: Preferences): Promise<void> {
      if (typeof preferences.hapticsEnabled !== 'boolean') {
        throw new Error('Invalid haptics preference');
      }
      const haptics = Number(preferences.hapticsEnabled);
      decodePreferences({
        language: preferences.language,
        theme_mode: preferences.themeMode,
        default_platform: preferences.defaultPlatform,
        haptics_enabled: haptics,
      });
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
      });
    },
  };
}
