import { useCallback, useRef, useState } from 'react';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { usePersistenceServices } from '../../providers/PersistenceProvider/PersistenceProvider';
import { useLocalClock } from '../app/useLocalClock';
import {
  buildBackup,
  buildCsv,
  buildMonthReport,
  MonthWithData,
  monthsWithData,
  parseBackup,
  recordsInMonth,
} from '../../features/export/exportData';
import { buildMonthPdf, pdfToBase64 } from '../../features/export/pdfReport';
import { pickTextFile, saveFile } from '../../features/export/exportFiles';
import { CashTransaction } from '../../features/transactions/types';
import { formatMoney } from '../../i18n/formatting';
import { dateTimeFormat } from '../../i18n/intlCache';
import { localDateKey } from '../../features/transactions/history';
import type { CalendarMonth } from '../../features/summary/periods';

export type DataMessage = { kind: 'success' | 'error'; text: string } | null;

export interface RestorePreview {
  records: CashTransaction[];
  from: string;
  to: string;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Export, backup and restore of operations. Every action is explicit and
// user-triggered; failures never touch stored data.
export function useDataTransfer() {
  const { t, language, locale } = useTranslation();
  const { services } = usePersistenceServices();
  const clock = useLocalClock();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<DataMessage>(null);
  const running = useRef(false);

  const run = useCallback(
    async <T>(action: () => Promise<T>, failure: string): Promise<T | null> => {
      if (running.current) {
        return null;
      }
      running.current = true;
      setBusy(true);
      setMessage(null);
      try {
        return await action();
      } catch {
        setMessage({ kind: 'error', text: failure });
        return null;
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [],
  );

  const monthLabel = useCallback(
    (month: CalendarMonth) =>
      capitalize(
        dateTimeFormat(locale, {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(Date.UTC(month.year, month.month - 1, 1))),
      ),
    [locale],
  );

  const loadMonths = useCallback(async (): Promise<MonthWithData[] | null> => {
    const months = await run(
      async () =>
        monthsWithData(await services.transactions.list(), clock.timeZone),
      t('exportFailed'),
    );
    return months;
  }, [run, services, clock.timeZone, t]);

  const exportMonth = useCallback(
    async (month: CalendarMonth, kind: 'pdf' | 'csv') => {
      const done = await run(async () => {
        const records = await services.transactions.list();
        const key = `${month.year}-${pad(month.month)}`;
        if (kind === 'csv') {
          const csv = buildCsv(
            recordsInMonth(records, month, clock.timeZone),
            language,
            clock.timeZone,
          );
          return saveFile({
            fileName: `cashdriver-${key}.csv`,
            mimeType: 'text/csv',
            content: csv,
            encoding: 'utf8',
          });
        }
        const report = buildMonthReport(records, month, clock.timeZone);
        const pdf = buildMonthPdf(
          report,
          {
            title: t('reportTitle', {
              month:
                language === 'es'
                  ? monthLabel(month).toLowerCase()
                  : monthLabel(month),
            }),
            generatedBy: t('reportGenerated'),
            page: t('reportPage'),
            operations: t('reportOperations'),
            fares: t('fareTotal'),
            tips: t('tipsTotal'),
            netCash: t('reportNetCash'),
            average: t('averageFare'),
            byPlatform: t('reportByPlatform'),
            byDay: t('reportByDay'),
            platform: t('platform'),
            day: t('reportDay'),
            total: t('reportTotal'),
          },
          {
            money: cents => formatMoney(cents, locale),
            dayLabel: dayKey => {
              const [year, monthNumber, day] = dayKey.split('-').map(Number);
              return dateTimeFormat(locale, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC',
              }).format(new Date(Date.UTC(year, monthNumber - 1, day)));
            },
          },
        );
        return saveFile({
          fileName: `cashdriver-informe-${key}.pdf`,
          mimeType: 'application/pdf',
          content: pdfToBase64(pdf),
          encoding: 'base64',
        });
      }, t('exportFailed'));
      if (done === 'saved') {
        setMessage({ kind: 'success', text: t('exportSaved') });
      }
      return done === 'saved';
    },
    [run, services, clock.timeZone, language, locale, t, monthLabel],
  );

  const saveBackup = useCallback(async () => {
    const done = await run(async () => {
      const records = await services.transactions.list();
      if (records.length === 0) {
        setMessage({ kind: 'error', text: t('noDataToExport') });
        return 'cancelled' as const;
      }
      const now = new Date();
      return saveFile({
        fileName: `cashdriver-copia-${localDateKey(now, clock.timeZone)}.json`,
        mimeType: 'application/json',
        content: buildBackup(records, now),
        encoding: 'utf8',
      });
    }, t('exportFailed'));
    if (done === 'saved') {
      setMessage({ kind: 'success', text: t('exportSaved') });
    }
  }, [run, services, clock.timeZone, t]);

  // Step 1 of a restore: choose a file and validate it. Nothing is written yet.
  const chooseBackup = useCallback(async (): Promise<RestorePreview | null> => {
    const preview = await run(async () => {
      const text = await pickTextFile();
      if (text === null) {
        return null;
      }
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        setMessage({
          kind: 'error',
          text: t(
            parsed.reason === 'version' ? 'restoreVersion' : 'restoreInvalid',
          ),
        });
        return null;
      }
      const times = parsed.records
        .map(record => Date.parse(record.createdAt))
        .sort((a, b) => a - b);
      const format = (time: number) =>
        dateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: clock.timeZone,
        }).format(new Date(time));
      return {
        records: parsed.records,
        from: format(times[0] ?? 0),
        to: format(times[times.length - 1] ?? 0),
      };
    }, t('restoreFailed'));
    return preview;
  }, [run, clock.timeZone, locale, t]);

  // Step 2: add the missing operations. Existing ones are never overwritten.
  const restore = useCallback(
    async (records: CashTransaction[]) => {
      const result = await run(
        () => services.transactions.importRecords(records),
        t('restoreFailed'),
      );
      if (!result) {
        return;
      }
      const text =
        result.inserted === 0 && result.conflicts === 0
          ? t('restoreNothingNew')
          : [
              t('restoreDone', {
                inserted: String(result.inserted),
                skipped: String(result.skipped),
              }),
              result.conflicts > 0
                ? t('restoreConflicts', { conflicts: String(result.conflicts) })
                : '',
            ]
              .filter(Boolean)
              .join(' ');
      setMessage({ kind: result.conflicts > 0 ? 'error' : 'success', text });
    },
    [run, services, t],
  );

  return {
    busy,
    message,
    clearMessage: () => setMessage(null),
    monthLabel,
    loadMonths,
    exportMonth,
    saveBackup,
    chooseBackup,
    restore,
  };
}
