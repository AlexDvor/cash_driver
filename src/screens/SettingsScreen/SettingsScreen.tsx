import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Switch,
  View,
} from 'react-native';
import { usePersistence } from '../../providers/PersistenceProvider/PersistenceProvider';
import { ActionButton } from '../../ui/ActionButton/ActionButton';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { ChoiceGroup } from '../../ui/ChoiceGroup/ChoiceGroup';
import { MultiChoiceGroup } from '../../ui/MultiChoiceGroup/MultiChoiceGroup';
import { PlatformIcon } from '../../components/PlatformIcon/PlatformIcon';
import { ScreenContainer } from '../../ui/ScreenContainer/ScreenContainer';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { languageOptions } from '../../i18n/translations';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { useDeletion } from '../../providers/DeletionProvider/DeletionProvider';
import { platforms, platformLabels } from '../../constants/platforms';
import { readAppVersion } from '../../features/settings/appVersion';
import { styles } from './SettingsScreen.styles';

export function SettingsScreen() {
  const { t, language } = useTranslation();
  const { colors } = useAppTheme();
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
      <AppText variant="title" accessibilityRole="header">
        {t('settings')}
      </AppText>
      {saving && (
        <ActivityIndicator
          accessibilityLabel={t('preferencesSaving')}
          color={colors.primary}
        />
      )}
      {errorKey && (
        <Card>
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
      <Card>
        <AppText variant="heading" accessibilityRole="header">
          {t('appearanceSection')}
        </AppText>
        <ChoiceGroup
          label={t('language')}
          options={languageOptions}
          value={language}
          onChange={value => {
            updatePreferences({ language: value });
          }}
          disabled={disabled}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ChoiceGroup
          label={t('theme')}
          value={preferences.themeMode}
          onChange={value => {
            updatePreferences({ themeMode: value });
          }}
          disabled={disabled}
          options={[
            { value: 'light', label: t('light') },
            { value: 'dark', label: t('dark') },
            { value: 'system', label: t('system') },
          ]}
        />
        <AppText variant="supporting" secondary>
          {t('systemHelp')}
        </AppText>
      </Card>
      <Card>
        <AppText variant="heading" accessibilityRole="header">
          {t('workSection')}
        </AppText>
        <MultiChoiceGroup
          label={t('workingPlatforms')}
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
          {t('workingPlatformsHelp')}
        </AppText>
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
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <AppText style={styles.toggleLabel}>
            {t('confirmationHaptics')}
          </AppText>
          <View
            pointerEvents="none"
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
        <AppText variant="supporting" secondary>
          {t('hapticsHelp')}
        </AppText>
      </Card>
      <Card>
        <AppText variant="heading" accessibilityRole="header">
          {t('appDataSection')}
        </AppText>
        <View style={styles.row}>
          <AppText>{t('currency')}</AppText>
          <AppText>EUR (€)</AppText>
        </View>
        {version ? (
          <View style={styles.row}>
            <AppText style={styles.toggleLabel}>{t('appVersion')}</AppText>
            <AppText testID="app-version">
              {version.version} ({version.build})
            </AppText>
          </View>
        ) : (
          <>
            <AppText accessibilityRole="alert">
              {t('versionUnavailable')}
            </AppText>
            <ActionButton
              label={t('retryVersion')}
              onPress={() => setVersion(readAppVersion())}
            />
          </>
        )}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <AppText variant="supporting" secondary>
          {t('localStorageHelp')}
        </AppText>
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
          variant="destructive"
          label={deleting ? t('deletingAll') : t('deleteAll')}
          loading={deleting}
          disabled={disabled || deletion.state.status !== 'idle'}
          onPress={confirmClear}
        />
        {deletion.allStatus === 'error' && (
          <ActionButton
            variant="destructive"
            label={t('retryDeleteAll')}
            disabled={disabled || deletion.state.status !== 'idle'}
            onPress={confirmClear}
          />
        )}
      </Card>
    </ScreenContainer>
  );
}
