import { opacity } from '../../constants/theme/tokens';
import React, { useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CalendarActivityFeedback } from '../../components/CalendarModal/CalendarActivityFeedback';
import { useCalendarMotion } from '../../hooks/app/useCalendarMotion';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { MultiChoiceGroup } from '../../ui/MultiChoiceGroup/MultiChoiceGroup';
import { PlatformIcon } from '../../components/PlatformIcon/PlatformIcon';
import { SettingsIcon } from '../../components/SettingsIcon/SettingsIcon';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { languageOptions } from '../../i18n/translations';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import { platforms, platformLabels } from '../../constants/platforms';
import { readAppVersion } from '../../features/settings/appVersion';
import { styles } from './SettingsScreen.styles';

export function SettingsScreen() {
  const motion = useCalendarMotion();
  const focused = useIsFocused();
  const { t, language } = useTranslation();
  const { colors, setMode, automaticThemeStatus } = useAppTheme();
  const { preferences, saving, errorKey, updatePreferences, retryPreferences } =
    usePersistence();
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
        <Card depth style={styles.section}>
          <AppText
            accessibilityRole="alert"
            style={{ color: colors.errorText }}
          >
            {t(errorKey)}
          </AppText>
          <ActionButton
            label={t('retryPreference')}
            disabled={disabled}
            onPress={retryPreferences}
          />
        </Card>
      )}
      <Card depth style={styles.section}>
        <View style={styles.sectionHeading}>
          <SettingsIcon name="palette" color={colors.primary} />
          <AppText
            variant="heading"
            accessibilityRole="header"
            style={styles.toggleLabel}
          >
            {t('appearanceSection')}
          </AppText>
        </View>
        <ChoiceGroup
          appearance="segmented"
          label={t('language')}
          headingVariant="body"
          options={languageOptions}
          value={language}
          onChange={value => {
            updatePreferences({ language: value });
          }}
          disabled={disabled}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ChoiceGroup
          layout="single-row"
          label={t('theme')}
          iconLayout="inline"
          headingVariant="body"
          value={preferences.themeMode}
          onChange={setMode}
          disabled={disabled}
          options={[
            {
              value: 'light',
              label: t('light'),
              icon: (
                <SettingsIcon
                  name="sun"
                  color={
                    preferences.themeMode === 'light'
                      ? colors.primary
                      : colors.text
                  }
                />
              ),
            },
            {
              value: 'dark',
              label: t('dark'),
              icon: (
                <SettingsIcon
                  name="moon"
                  color={
                    preferences.themeMode === 'dark'
                      ? colors.primary
                      : colors.text
                  }
                />
              ),
            },
            {
              value: 'system',
              label: t('system'),
              icon: (
                <SettingsIcon
                  name="phone"
                  color={
                    preferences.themeMode === 'system'
                      ? colors.primary
                      : colors.text
                  }
                />
              ),
            },
          ]}
        />
        <AppText variant="supporting" secondary>
          {t(
            preferences.themeMode === 'system'
              ? automaticThemeStatus === 'solar'
                ? 'solarThemeHelp'
                : automaticThemeStatus === 'locating'
                ? 'solarThemeLocating'
                : 'solarThemeFallback'
              : preferences.themeMode === 'dark'
              ? 'darkThemeHelp'
              : 'lightThemeHelp',
          )}
        </AppText>
      </Card>
      <Card depth style={styles.section}>
        <View style={styles.sectionHeading}>
          <SettingsIcon name="briefcase" color={colors.primary} />
          <AppText
            variant="heading"
            accessibilityRole="header"
            style={styles.toggleLabel}
          >
            {t('workSection')}
          </AppText>
        </View>
        <MultiChoiceGroup
          label={t('workingPlatforms')}
          description={t('workingPlatformsHelp')}
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
        />
        <AppText variant="supporting" secondary>
          {t('workingPlatformsMinimum')}
        </AppText>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={t('confirmationHaptics')}
          accessibilityState={{ checked: preferences.hapticsEnabled, disabled }}
          disabled={disabled}
          onPress={() => {
            updatePreferences({ hapticsEnabled: !preferences.hapticsEnabled });
          }}
          style={({ pressed }) => [
            styles.hapticsRow,
            pressed && { opacity: opacity.pressed },
          ]}
        >
          <View style={styles.hapticsText}>
            <AppText>{t('confirmationHaptics')}</AppText>
            <AppText variant="supporting" secondary>
              {t('hapticsHelp')}
            </AppText>
          </View>
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Switch
              accessible={false}
              importantForAccessibility="no"
              testID="settings-haptics-switch"
              value={preferences.hapticsEnabled}
              disabled={disabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={t('confirmationSound')}
          accessibilityState={{ checked: preferences.soundEnabled, disabled }}
          disabled={disabled}
          onPress={() => {
            updatePreferences({ soundEnabled: !preferences.soundEnabled });
          }}
          style={({ pressed }) => [
            styles.hapticsRow,
            pressed && { opacity: opacity.pressed },
          ]}
        >
          <View style={styles.hapticsText}>
            <AppText>{t('confirmationSound')}</AppText>
            <AppText variant="supporting" secondary>
              {t('soundHelp')}
            </AppText>
          </View>
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Switch
              accessible={false}
              importantForAccessibility="no"
              testID="settings-sound-switch"
              value={preferences.soundEnabled}
              disabled={disabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Pressable>
      </Card>
      <Card depth style={styles.section}>
        <View style={styles.sectionHeading}>
          <SettingsIcon name="info" color={colors.primary} />
          <AppText
            variant="heading"
            accessibilityRole="header"
            style={styles.toggleLabel}
          >
            {t('appSection')}
          </AppText>
        </View>
        <View>
          <View style={styles.row}>
            <AppText style={styles.toggleLabel}>{t('currency')}</AppText>
            <AppText>EUR (€)</AppText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {version ? (
            <View style={styles.row}>
              <AppText style={styles.toggleLabel}>{t('appVersion')}</AppText>
              <AppText testID="app-version">
                {version.version} ({version.build})
              </AppText>
            </View>
          ) : (
            <View style={[styles.section, styles.versionError]}>
              <AppText accessibilityRole="alert">
                {t('versionUnavailable')}
              </AppText>
              <ActionButton
                label={t('retryVersion')}
                onPress={() => setVersion(readAppVersion())}
              />
            </View>
          )}
        </View>
      </Card>
      <Card depth style={styles.section}>
        <View style={styles.sectionHeading}>
          <SettingsIcon name="database" color={colors.primary} />
          <AppText
            variant="heading"
            accessibilityRole="header"
            style={styles.toggleLabel}
          >
            {t('deviceDataSection')}
          </AppText>
        </View>
        <View style={styles.storageRow}>
          <View style={styles.storageText}>
            <AppText style={styles.storageTitle}>
              {t('localStorageTitle')}
            </AppText>
            <AppText variant="supporting" secondary>
              {t('localStorageHelp')}
            </AppText>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
          variant="destructive-outline"
          renderIcon={color => <SettingsIcon name="trash" color={color} />}
          label={deleting ? t('deletingAll') : t('deleteAll')}
          loading={deleting}
          disabled={disabled || deletion.state.status !== 'idle'}
          onPress={confirmClear}
        />
        {deletion.allStatus === 'error' && (
          <ActionButton
            variant="destructive-outline"
            renderIcon={color => <SettingsIcon name="trash" color={color} />}
            label={t('retryDeleteAll')}
            disabled={disabled || deletion.state.status !== 'idle'}
            onPress={confirmClear}
          />
        )}
      </Card>
    </ScreenContainer>
  );
}
