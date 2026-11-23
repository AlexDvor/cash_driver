import { opacity } from '../../constants/theme/tokens';
import React, { useState } from 'react';
import { Alert, AppState, Pressable, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CalendarActivityFeedback } from '../../components/CalendarModal/CalendarActivityFeedback';
import { useCalendarMotion } from '../../hooks/app/useCalendarMotion';
import {
  usePersistence,
  usePersistenceStatus,
} from '../../providers/PersistenceProvider/PersistenceProvider';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { SelectRow } from '../../ui/SelectRow/SelectRow';
import { MultiChoiceGroup } from '../../ui/MultiChoiceGroup/MultiChoiceGroup';
import { PlatformIcon } from '../../components/PlatformIcon/PlatformIcon';
import { SettingsIcon } from '../../components/SettingsIcon/SettingsIcon';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { languageOptions } from '../../i18n/translations';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import { platforms, platformLabels } from '../../constants/platforms';
import { confirmationHaptics } from '../../features/settings/confirmationHaptics';
import { confirmationSound } from '../../features/settings/confirmationSound';
import { readAppVersion } from '../../features/settings/appVersion';
import { Toggle } from '../../ui/Toggle/Toggle';
import { styles } from './SettingsScreen.styles';

export function SettingsScreen() {
  const motion = useCalendarMotion();
  const focused = useIsFocused();
  const { t, language } = useTranslation();
  const { colors, setMode, automaticThemeStatus } = useAppTheme();
  const { preferences, updatePreferences, retryPreferences } = usePersistence();
  const { saving, errorKey } = usePersistenceStatus();
  const deletion = useDeletion();
  const [version, setVersion] = useState(readAppVersion);
  const deleting = deletion.allStatus === 'writing';
  const disabled = saving || deleting;
  function confirmClear() {
    if (deletion.state.status !== 'idle' || deleting) {
      return;
    }
    Alert.alert(t('deleteAll'), t('deleteAllQuestion'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteAllConfirm'),
        style: 'destructive',
        onPress: () => {
          deletion.clearAll();
        },
      },
    ]);
  }
  // Grouped-list layout (Figma Screen/Ajustes, first version): uppercase group
  // title above a flat card. Content, handlers and labels are unchanged.
  const group = (
    title: string,
    children: React.ReactNode,
    after?: React.ReactNode,
  ) => (
    <View style={styles.group}>
      <AppText
        variant="supporting"
        accessibilityRole="header"
        style={[styles.groupTitle, { color: colors.tertiaryText }]}
      >
        {title}
      </AppText>
      <Card style={styles.section}>{children}</Card>
      {after}
    </View>
  );
  const divider = (
    <View style={[styles.divider, { backgroundColor: colors.border }]} />
  );
  return (
    <ScreenContainer>
      <View>
        <AppText variant="title" accessibilityRole="header">
          {t('settings')}
        </AppText>
        <View style={styles.saveProgress} pointerEvents="none">
          <CalendarActivityFeedback
            status={saving ? 'loading' : 'ready'}
            requestKey="preferences"
            message={t('preferencesSaving')}
            motion={{ ...motion, active: motion.active && focused }}
          />
        </View>
      </View>
      {errorKey && (
        <Card style={styles.section}>
          <AppText
            accessibilityRole="alert"
            style={{ color: colors.errorText }}
          >
            {t(errorKey)}
          </AppText>
          <ActionButton
            compact
            label={t('retryPreference')}
            disabled={disabled}
            onPress={retryPreferences}
          />
        </Card>
      )}
      {group(
        t('appearanceSection'),
        <>
          {/* Figma rows "Idioma · Español ⌄" / "Tema · Oscuro ⌄": full-width
              option lists fit any font scale and screen width. */}
          <SelectRow
            testID="settings-language"
            label={t('language')}
            options={languageOptions}
            value={language}
            onChange={value => {
              updatePreferences({ language: value });
            }}
            disabled={disabled}
          />
          {divider}
          <SelectRow
            testID="settings-theme"
            label={t('theme')}
            options={[
              { value: 'light', label: t('light') },
              { value: 'dark', label: t('dark') },
              { value: 'system', label: t('system') },
            ]}
            value={preferences.themeMode}
            onChange={setMode}
            disabled={disabled}
          />
          <AppText variant="supporting" secondary style={styles.help}>
            {t(
              preferences.themeMode === 'system'
                ? automaticThemeStatus === 'solar'
                  ? 'solarThemeShort'
                  : automaticThemeStatus === 'locating'
                  ? 'solarThemeLocatingShort'
                  : 'solarThemeFallbackShort'
                : preferences.themeMode === 'dark'
                ? 'darkThemeHelp'
                : 'lightThemeHelp',
            )}
          </AppText>
          {preferences.themeMode === 'system' && (
            <ActionButton
              compact
              variant="outline"
              label={t('moreInformation')}
              onPress={() =>
                Alert.alert(
                  t('system'),
                  t('solarThemeHelp') + '\n\n' + t('solarThemeFallback'),
                )
              }
            />
          )}
        </>,
      )}
      {group(
        t('workingPlatforms'),
        <MultiChoiceGroup
          compact
          hideLabel
          label={t('workingPlatforms')}
          description={t('workingPlatformsShort')}
          options={platforms.map(value => ({
            value,
            label: platformLabels[value],
            icon: <PlatformIcon platform={value} />,
          }))}
          values={preferences.enabledPlatforms}
          lastChoiceHint={t('workingPlatformsMinimum')}
          onToggle={value => {
            const enabledPlatforms = preferences.enabledPlatforms.includes(
              value,
            )
              ? preferences.enabledPlatforms.filter(
                  platform => platform !== value,
                )
              : [...preferences.enabledPlatforms, value];
            if (enabledPlatforms.length > 0) {
              updatePreferences({ enabledPlatforms });
            }
          }}
          disabled={disabled}
        />,
      )}
      {group(
        t('paymentFeedbackSection'),
        <>
          <AppText variant="supporting" secondary style={styles.help}>
            {t('paymentFeedbackHelp')}
          </AppText>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={t('confirmationSound')}
            accessibilityState={{ checked: preferences.soundEnabled, disabled }}
            disabled={disabled}
            onPress={() => {
              updatePreferences({ soundEnabled: !preferences.soundEnabled });
            }}
            style={({ pressed }) => [
              styles.switchRow,
              pressed && { opacity: opacity.pressed },
            ]}
          >
            <View style={styles.switchText}>
              <AppText>{t('soundSettingLabel')}</AppText>
            </View>
            <Toggle
              testID="settings-sound-switch"
              value={preferences.soundEnabled}
            />
          </Pressable>
          {divider}
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={t('confirmationHaptics')}
            accessibilityState={{
              checked: preferences.hapticsEnabled,
              disabled,
            }}
            disabled={disabled}
            onPress={() => {
              updatePreferences({
                hapticsEnabled: !preferences.hapticsEnabled,
              });
            }}
            style={({ pressed }) => [
              styles.switchRow,
              pressed && { opacity: opacity.pressed },
            ]}
          >
            <View style={styles.switchText}>
              <AppText>{t('vibrationSettingLabel')}</AppText>
            </View>
            <Toggle
              testID="settings-haptics-switch"
              value={preferences.hapticsEnabled}
            />
          </Pressable>
        </>,
        // Figma: the preview action sits below the card.
        <ActionButton
          compact
          variant="secondary"
          label={t('previewPaymentFeedback')}
          renderIcon={color => <SettingsIcon name="play" color={color} />}
          disabled={
            disabled ||
            (!preferences.soundEnabled && !preferences.hapticsEnabled)
          }
          onPress={() => {
            if (disabled || !focused || AppState.currentState !== 'active')
              return;
            confirmationSound(preferences.soundEnabled);
            confirmationHaptics(preferences.hapticsEnabled);
          }}
        />,
      )}
      {group(
        t('deviceDataSection'),
        <>
          {version ? (
            <View style={styles.infoRow}>
              <AppText style={styles.valueLabel}>{t('appVersion')}</AppText>
              <AppText secondary testID="app-version" style={styles.value}>
                {version.version} ({version.build})
              </AppText>
            </View>
          ) : (
            <View style={styles.section}>
              <AppText accessibilityRole="alert">
                {t('versionUnavailable')}
              </AppText>
              <ActionButton
                compact
                label={t('retryVersion')}
                onPress={() => setVersion(readAppVersion())}
              />
            </View>
          )}
          {divider}
          <View style={styles.storageText}>
            <AppText style={styles.storageTitle}>
              {t('localStorageTitle')}
            </AppText>
            <AppText variant="supporting" secondary style={styles.help}>
              {t('localStorageShort')}
            </AppText>
          </View>
        </>,
        // Figma: deletion feedback and the destructive action sit below the card.
        <View style={styles.after}>
          {deletion.allStatus === 'error' && (
            <AppText
              accessibilityRole="alert"
              style={{ color: colors.errorText }}
            >
              {t('deleteAllFailed')}
            </AppText>
          )}
          {deletion.allStatus === 'success' && (
            <AppText accessibilityLiveRegion="polite">
              {t('deleteAllSuccess')}
            </AppText>
          )}
          <ActionButton
            compact
            variant="destructive"
            renderIcon={color => <SettingsIcon name="trash" color={color} />}
            label={deleting ? t('deletingAll') : t('deleteAll')}
            loading={deleting}
            disabled={disabled || deletion.state.status !== 'idle'}
            onPress={confirmClear}
          />
          {deletion.allStatus === 'error' && (
            <ActionButton
              compact
              variant="destructive"
              renderIcon={color => <SettingsIcon name="trash" color={color} />}
              label={t('retryDeleteAll')}
              disabled={disabled || deletion.state.status !== 'idle'}
              onPress={confirmClear}
            />
          )}
        </View>,
      )}
      <View style={styles.footer}>
        <AppText
          variant="supporting"
          style={[styles.footerText, { color: colors.tertiaryText }]}
        >
          {t('currency')}: EUR (€)
        </AppText>
      </View>
    </ScreenContainer>
  );
}
