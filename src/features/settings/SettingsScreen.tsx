import React from 'react';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { PendingFeature } from '../../components/PendingFeature';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useTranslation } from '../../i18n/LanguageProvider';
import { languageOptions } from '../../i18n/translations';
import { ThemeMode } from '../../theme/resolveTheme';
import { useAppTheme } from '../../theme/ThemeProvider';
import { usePersistence } from '../../app/PersistenceProvider';

export function SettingsScreen() {
  const { t, language, setLanguage } = useTranslation();
  const { mode, setMode } = useAppTheme();
  const { saving, errorKey } = usePersistence();
  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
    { value: 'system', label: t('system') },
  ];
  return (
    <ScreenContainer>
      <AppText variant="title" accessibilityRole="header">
        {t('settings')}
      </AppText>
      <AppText secondary>{t('preferencesSaved')}</AppText>
      {errorKey && <AppText accessibilityRole="alert">{t(errorKey)}</AppText>}
      <Card>
        <ChoiceGroup
          label={t('language')}
          options={languageOptions}
          value={language}
          onChange={setLanguage}
          disabled={saving}
        />
        <ChoiceGroup
          label={t('theme')}
          options={themeOptions}
          value={mode}
          onChange={setMode}
          disabled={saving}
        />
        <AppText variant="supporting" secondary>
          {t('systemHelp')}
        </AppText>
      </Card>
      <PendingFeature message={t('settingsPending')} />
    </ScreenContainer>
  );
}
