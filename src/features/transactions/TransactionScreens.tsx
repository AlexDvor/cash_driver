import React from 'react';
import { AppText } from '../../components/AppText';
import { PendingFeature } from '../../components/PendingFeature';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useTranslation } from '../../i18n/LanguageProvider';

export { HomeScreen } from './HomeScreen';

export function HistoryScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer>
      <AppText variant="title" accessibilityRole="header">
        {t('history')}
      </AppText>
      <PendingFeature message={t('historyPending')} />
    </ScreenContainer>
  );
}

export function DetailsScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer hasHeader>
      <PendingFeature message={t('detailsPending')} />
    </ScreenContainer>
  );
}

export function EditScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer hasHeader>
      <PendingFeature message={t('editPending')} />
    </ScreenContainer>
  );
}
