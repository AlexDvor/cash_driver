import React from 'react';
import { ActivityIndicator } from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { useTranslation } from '../../i18n/LanguageProvider';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeletion } from './DeletionProvider';

export function DeletionNotice() {
  const deletion = useDeletion();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  if (deletion.state.status === 'idle') {
    return null;
  }
  return (
    <Card>
      <AppText
        accessibilityLiveRegion="polite"
        style={{
          color:
            deletion.state.status === 'error' ? colors.errorText : colors.text,
        }}
      >
        {t(
          deletion.state.status === 'error'
            ? 'deleteFailed'
            : deletion.state.status === 'writing'
            ? 'deleting'
            : 'deletionPending',
        )}
      </AppText>
      {deletion.state.status === 'pending' && (
        <ActionButton label={t('undo')} onPress={deletion.undo} />
      )}
      {deletion.state.status === 'writing' && (
        <ActivityIndicator color={colors.primary} />
      )}
      {deletion.state.status === 'error' && (
        <>
          <ActionButton label={t('retry')} onPress={deletion.retry} />
          <ActionButton label={t('cancel')} onPress={deletion.cancelError} />
        </>
      )}
    </Card>
  );
}
