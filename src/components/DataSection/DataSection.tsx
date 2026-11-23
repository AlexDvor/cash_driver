import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../ui/AppText/AppText';
import { Card } from '../../ui/Card/Card';
import { IconPlate } from '../../ui/IconPlate/IconPlate';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { useDataTransfer } from '../../hooks/data/useDataTransfer';
import type { MonthWithData } from '../../features/export/exportData';
import CalendarIcon from '../../assets/icons/duotone/calendar.svg';
import DatabaseIcon from '../../assets/icons/duotone/database.svg';
import RestoreIcon from '../../assets/icons/duotone/restore.svg';
import PdfIcon from '../../assets/icons/duotone/banknote.svg';
import CsvIcon from '../../assets/icons/duotone/bars.svg';
import ChevronRight from '../../assets/icons/line/chevron-right.svg';
import { spacing } from '../../constants/theme/tokens';
import { styles } from './DataSection.styles';

function ActionRow({
  icon,
  title,
  hint,
  onPress,
  disabled,
  testID,
  chevron = true,
}: {
  icon: React.ComponentType<SvgProps>;
  title: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
  testID: string;
  chevron?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${hint}`}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surfaceRaised },
        disabled && styles.disabled,
      ]}
    >
      <IconPlate icon={icon} size={40} />
      <View style={styles.rowText}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        <AppText variant="supporting" secondary>
          {hint}
        </AppText>
      </View>
      {chevron && (
        <ChevronRight
          width={18}
          height={18}
          color={colors.tertiaryText}
          accessible={false}
        />
      )}
    </Pressable>
  );
}

// "Datos" group in Ajustes: export a month (PDF/CSV), save and restore a backup.
export function DataSection() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const data = useDataTransfer();
  const insets = useSafeAreaInsets();
  const [months, setMonths] = useState<MonthWithData[] | null>(null);
  const [month, setMonth] = useState<MonthWithData | null>(null);
  const sheetOpen = months !== null;

  async function openExport() {
    const found = await data.loadMonths();
    if (!found) {
      return;
    }
    if (found.length === 0) {
      Alert.alert(t('exportMonth'), t('noDataToExport'));
      return;
    }
    setMonths(found);
    setMonth(null);
  }

  function closeSheet() {
    setMonths(null);
    setMonth(null);
  }

  async function exportAs(kind: 'pdf' | 'csv') {
    if (!month) {
      return;
    }
    closeSheet();
    await data.exportMonth(month, kind);
  }

  async function startRestore() {
    const preview = await data.chooseBackup();
    if (!preview) {
      return;
    }
    Alert.alert(
      t('backupRestore'),
      t('restoreFound', {
        count: String(preview.records.length),
        from: preview.from,
        to: preview.to,
      }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('restoreConfirm'),
          onPress: () => {
            data.restore(preview.records);
          },
        },
      ],
    );
  }

  return (
    <View style={styles.group}>
      <AppText
        variant="supporting"
        accessibilityRole="header"
        style={[styles.groupTitle, { color: colors.tertiaryText }]}
      >
        {t('dataSection')}
      </AppText>
      <Card style={styles.card}>
        <ActionRow
          testID="data-export-month"
          icon={CalendarIcon}
          title={t('exportMonth')}
          hint={t('exportMonthHint')}
          disabled={data.busy}
          onPress={openExport}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ActionRow
          testID="data-backup-save"
          icon={DatabaseIcon}
          title={t('backupSave')}
          hint={t('backupSaveHint')}
          disabled={data.busy}
          onPress={data.saveBackup}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ActionRow
          testID="data-backup-restore"
          icon={RestoreIcon}
          title={t('backupRestore')}
          hint={t('backupRestoreHint')}
          disabled={data.busy}
          onPress={startRestore}
        />
      </Card>
      {data.busy && (
        <View style={styles.status} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.primary} />
          <AppText variant="supporting" secondary>
            {t('exportWorking')}
          </AppText>
        </View>
      )}
      {data.message && (
        <AppText
          testID="data-message"
          variant="supporting"
          accessibilityRole={
            data.message.kind === 'error' ? 'alert' : undefined
          }
          accessibilityLiveRegion="polite"
          style={{
            color:
              data.message.kind === 'error' ? colors.errorText : colors.primary,
          }}
        >
          {data.message.text}
        </AppText>
      )}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <Pressable
          style={styles.backdrop}
          onPress={closeSheet}
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: spacing.xxl + insets.bottom,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <AppText variant="heading" accessibilityRole="header">
            {month ? data.monthLabel(month) : t('chooseMonth')}
          </AppText>
          {month ? (
            <View>
              <ActionRow
                testID="data-format-pdf"
                icon={PdfIcon}
                title={t('exportPdf')}
                hint={t('exportPdfHint')}
                onPress={() => exportAs('pdf')}
              />
              <ActionRow
                testID="data-format-csv"
                icon={CsvIcon}
                title={t('exportCsv')}
                hint={t('exportCsvHint')}
                onPress={() => exportAs('csv')}
              />
            </View>
          ) : (
            <ScrollView style={styles.months}>
              {months?.map(item => (
                <Pressable
                  key={`${item.year}-${item.month}`}
                  testID={`data-month-${item.year}-${item.month}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${data.monthLabel(item)}. ${t(
                    'monthOperations',
                    { count: String(item.count) },
                  )}`}
                  onPress={() => setMonth(item)}
                  style={({ pressed }) => [
                    styles.monthRow,
                    { borderColor: colors.border },
                    pressed && { backgroundColor: colors.surfaceRaised },
                  ]}
                >
                  <AppText style={styles.rowTitle}>
                    {data.monthLabel(item)}
                  </AppText>
                  <AppText variant="supporting" secondary>
                    {t('monthOperations', { count: String(item.count) })}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
