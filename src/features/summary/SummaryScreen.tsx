import React from 'react';
import { AppText } from '../../components/AppText';
import { PendingFeature } from '../../components/PendingFeature';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useTranslation } from '../../i18n/LanguageProvider';

export function SummaryScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer>
      <AppText variant="title" accessibilityRole="header">
        {t('summary')}
      </AppText>
      <PendingFeature message={t('summaryPending')} />
    </ScreenContainer>
  );
}
