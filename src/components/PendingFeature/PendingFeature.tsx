import React from 'react';
import { useTranslation } from '../../i18n/LanguageProvider';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';

export function PendingFeature({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <Card>
      <AppText variant="heading" accessibilityRole="header">
        {t('unfinished')}
      </AppText>
      <AppText secondary>{message}</AppText>
    </Card>
  );
}
