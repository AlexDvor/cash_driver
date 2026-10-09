import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Switch,
  View,
} from 'react-native';
import { usePersistence } from '../../app/PersistenceProvider';
import { ActionButton } from '../../components/ActionButton';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useTranslation } from '../../i18n/LanguageProvider';
import { languageOptions } from '../../i18n/translations';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeletion } from '../../features/transactions/DeletionProvider';
import { platformLabels } from '../../features/transactions/history';
import { platforms } from '../../features/transactions/types';
import {
  packageVersion,
  readAppVersion,
} from '../../features/settings/appVersion';
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
        <View style={styles.row}>
          <AppText>{t('currency')}</AppText>
          <AppText>EUR (€)</AppText>
        </View>
        <ChoiceGroup
          label={t('language')}
          options={languageOptions}
          value={language}
          onChange={value => {
            updatePreferences({ language: value });
          }}
          disabled={disabled}
        />
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
        <ChoiceGroup
          label={t('defaultPlatform')}
          options={platforms.map(value => ({
            value,
            label: platformLabels[value],
          }))}
          value={preferences.defaultPlatform}
          onChange={value => {
            updatePreferences({ defaultPlatform: value });
          }}
          disabled={disabled}
        />
        <AppText variant="supporting" secondary>
          {t('defaultPlatformHelp')}
        </AppText>
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
        <AppText variant="heading">{t('appVersion')}</AppText>
        {version ? (
          <>
            <AppText testID="app-version">
              {version.version} ({version.build})
            </AppText>
            {version.version !== packageVersion && (
              <AppText variant="supporting" secondary>
                {t('packageVersionDifference', { version: packageVersion })}
              </AppText>
            )}
          </>
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
        <AppText secondary>{t('localStorageHelp')}</AppText>
      </Card>
      {deletion.allStatus === 'error' && (
        <AppText accessibilityRole="alert" style={{ color: colors.errorText }}>
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
    </ScreenContainer>
  );
}
