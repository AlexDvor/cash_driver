import { validate as isUuid } from 'uuid';
import { platforms, platformLabels } from '../../constants/platforms';
import { dateTimeFormat } from '../../i18n/intlCache';
import { summarizeTransactions } from '../summary/summary';
import { CalendarMonth, getCalendarMonthOf } from '../summary/periods';
import { calculatePayment } from '../transactions/payment';
import { localDateKey } from '../transactions/history';
import { CashTransaction, Platform } from '../transactions/types';

export const BACKUP_APP = 'cash-driver';
export const BACKUP_VERSION = 1;

export interface MonthWithData extends CalendarMonth {
  count: number;
}

function monthIndex(month: CalendarMonth): number {
  return month.year * 12 + (month.month - 1);
}

function byTime(left: CashTransaction, right: CashTransaction): number {
  const difference = Date.parse(left.createdAt) - Date.parse(right.createdAt);
  if (difference !== 0) {
    return difference;
  }
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

// Months that contain at least one operation, newest first.
export function monthsWithData(
  records: readonly CashTransaction[],
  timeZone: string,
): MonthWithData[] {
  const counts = new Map<number, MonthWithData>();
  for (const record of records) {
    const month = getCalendarMonthOf(new Date(record.createdAt), timeZone);
    const key = monthIndex(month);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { ...month, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => monthIndex(b) - monthIndex(a));
}

// Operations of one local calendar month, oldest first.
export function recordsInMonth(
  records: readonly CashTransaction[],
  month: CalendarMonth,
  timeZone: string,
): CashTransaction[] {
  return records
    .filter(record => {
      const own = getCalendarMonthOf(new Date(record.createdAt), timeZone);
      return own.year === month.year && own.month === month.month;
    })
    .sort(byTime);
}

export function formatCents(cents: number, decimalSeparator: string): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${whole}${decimalSeparator}${fraction}`;
}

function csvCell(value: string, delimiter: string): string {
  return value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n')
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

const CSV_HEADERS = {
  es: [
    'Fecha',
    'Hora',
    'Plataforma',
    'Importe',
    'Entregado',
    'Cambio',
    'Propina',
    'Efectivo neto',
  ],
  en: [
    'Date',
    'Time',
    'Platform',
    'Fare',
    'Received',
    'Change',
    'Tip',
    'Net cash',
  ],
} as const;

// Excel-friendly CSV: Spanish uses ";" and "," decimals, English "," and ".".
export function buildCsv(
  records: readonly CashTransaction[],
  language: 'es' | 'en',
  timeZone: string,
): string {
  const delimiter = language === 'es' ? ';' : ',';
  const decimal = language === 'es' ? ',' : '.';
  const time = dateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const rows: string[][] = [[...CSV_HEADERS[language]]];
  for (const record of [...records].sort(byTime)) {
    const date = new Date(record.createdAt);
    rows.push([
      localDateKey(date, timeZone),
      time.format(date),
      platformLabels[record.platform],
      formatCents(record.fareAmountCents, decimal),
      formatCents(record.cashReceivedCents, decimal),
      formatCents(record.changeGivenCents, decimal),
      formatCents(record.tipCents, decimal),
      formatCents(record.netCashCents, decimal),
    ]);
  }
  const summary = summarizeTransactions(records);
  rows.push([
    'Total',
    '',
    '',
    formatCents(summary.fareTotalCents, decimal),
    '',
    '',
    formatCents(summary.tipTotalCents, decimal),
    formatCents(summary.netCashTotalCents, decimal),
  ]);
  return (
    '﻿' +
    rows
      .map(row => row.map(cell => csvCell(cell, delimiter)).join(delimiter))
      .join('\r\n') +
    '\r\n'
  );
}

export interface MonthReport {
  month: CalendarMonth;
  count: number;
  fareTotalCents: number;
  tipTotalCents: number;
  netCashTotalCents: number;
  averageFareCents: number;
  platforms: {
    platform: Platform;
    count: number;
    fareCents: number;
    tipCents: number;
  }[];
  days: {
    key: string;
    count: number;
    fareCents: number;
    tipCents: number;
    netCashCents: number;
  }[];
}

export function buildMonthReport(
  allRecords: readonly CashTransaction[],
  month: CalendarMonth,
  timeZone: string,
): MonthReport {
  const records = recordsInMonth(allRecords, month, timeZone);
  const summary = summarizeTransactions(records);
  const platformRows = platforms
    .map(platform => {
      const own = records.filter(record => record.platform === platform);
      return {
        platform,
        count: own.length,
        fareCents: own.reduce((sum, r) => sum + r.fareAmountCents, 0),
        tipCents: own.reduce((sum, r) => sum + r.tipCents, 0),
      };
    })
    .filter(row => row.count > 0);
  const days: MonthReport['days'] = [];
  for (const record of records) {
    const key = localDateKey(new Date(record.createdAt), timeZone);
    const last = days[days.length - 1];
    if (last && last.key === key) {
      last.count += 1;
      last.fareCents += record.fareAmountCents;
      last.tipCents += record.tipCents;
      last.netCashCents += record.netCashCents;
    } else {
      days.push({
        key,
        count: 1,
        fareCents: record.fareAmountCents,
        tipCents: record.tipCents,
        netCashCents: record.netCashCents,
      });
    }
  }
  return {
    month,
    count: summary.operationCount,
    fareTotalCents: summary.fareTotalCents,
    tipTotalCents: summary.tipTotalCents,
    netCashTotalCents: summary.netCashTotalCents,
    averageFareCents: summary.averageFareCents,
    platforms: platformRows,
    days,
  };
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  count: number;
  transactions: CashTransaction[];
}

export function buildBackup(
  records: readonly CashTransaction[],
  now: Date,
): string {
  const file: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    count: records.length,
    transactions: [...records].sort(byTime),
  };
  return JSON.stringify(file, null, 2);
}

export type BackupParseResult =
  | { ok: true; records: CashTransaction[] }
  | { ok: false; reason: 'format' | 'version' | 'records' };

function isIso(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function isCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function validRecord(value: unknown): CashTransaction | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const r = value as Record<string, unknown>;
  if (
    typeof r.id !== 'string' ||
    !isUuid(r.id) ||
    !platforms.includes(r.platform as Platform) ||
    !isCents(r.fareAmountCents) ||
    !isCents(r.cashReceivedCents) ||
    !isCents(r.changeGivenCents) ||
    !isCents(r.tipCents) ||
    !isCents(r.netCashCents) ||
    !isIso(r.createdAt) ||
    !(r.updatedAt === null || isIso(r.updatedAt))
  ) {
    return null;
  }
  const payment = calculatePayment({
    fareAmountCents: r.fareAmountCents,
    cashReceivedCents: r.cashReceivedCents,
    tipCents: r.tipCents,
  });
  if (
    payment.status !== 'valid' ||
    payment.changeGivenCents !== r.changeGivenCents ||
    payment.netCashCents !== r.netCashCents ||
    payment.tipCents !== r.tipCents
  ) {
    return null;
  }
  return {
    id: r.id,
    platform: r.platform as Platform,
    fareAmountCents: r.fareAmountCents,
    cashReceivedCents: r.cashReceivedCents,
    changeGivenCents: r.changeGivenCents,
    tipCents: r.tipCents,
    netCashCents: r.netCashCents,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt as string | null,
  };
}

// Strict: one bad record rejects the whole file so nothing is half-imported.
export function parseBackup(text: string): BackupParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    (data as BackupFile).app !== BACKUP_APP ||
    !Array.isArray((data as BackupFile).transactions)
  ) {
    return { ok: false, reason: 'format' };
  }
  if ((data as BackupFile).version !== BACKUP_VERSION) {
    return { ok: false, reason: 'version' };
  }
  const records: CashTransaction[] = [];
  const ids = new Set<string>();
  for (const item of (data as BackupFile).transactions) {
    const record = validRecord(item);
    if (!record || ids.has(record.id)) {
      return { ok: false, reason: 'records' };
    }
    ids.add(record.id);
    records.push(record);
  }
  return { ok: true, records };
}
