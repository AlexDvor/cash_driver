import {
  buildBackup,
  buildCsv,
  buildMonthReport,
  monthsWithData,
  parseBackup,
  recordsInMonth,
} from './exportData';
import { buildMonthPdf, pdfToBase64 } from './pdfReport';
import { CashTransaction } from '../transactions/types';

const zone = 'Europe/Madrid';

function record(
  n: number,
  createdAt: string,
  overrides: Partial<CashTransaction> = {},
): CashTransaction {
  return {
    id: `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, '0')}`,
    platform: 'uber',
    fareAmountCents: 1850,
    cashReceivedCents: 2000,
    changeGivenCents: 100,
    tipCents: 50,
    netCashCents: 1900,
    createdAt,
    updatedAt: null,
    ...overrides,
  };
}

const records = [
  record(1, '2026-11-02T08:15:00.000Z'),
  record(2, '2026-11-02T20:30:00.000Z', {
    platform: 'bolt',
    fareAmountCents: 1000,
    cashReceivedCents: 1000,
    changeGivenCents: 0,
    tipCents: 0,
    netCashCents: 1000,
  }),
  record(3, '2026-10-30T22:59:00.000Z'),
  // 23:30 UTC on 30 Nov is already 1 Dec in Madrid.
  record(4, '2026-11-30T23:30:00.000Z'),
];

test('lists months with data newest first using the local time zone', () => {
  expect(monthsWithData(records, zone)).toEqual([
    { year: 2026, month: 12, count: 1 },
    { year: 2026, month: 11, count: 2 },
    { year: 2026, month: 10, count: 1 },
  ]);
});

test('selects the operations of one local month, oldest first', () => {
  const november = recordsInMonth(records, { year: 2026, month: 11 }, zone);
  expect(november.map(r => r.id.slice(-1))).toEqual(['1', '2']);
});

test('Spanish CSV uses semicolons, decimal commas and a totals row', () => {
  const csv = buildCsv(
    recordsInMonth(records, { year: 2026, month: 11 }, zone),
    'es',
    zone,
  );
  const lines = csv.replace('﻿', '').trim().split('\r\n');
  expect(lines[0]).toBe(
    'Fecha;Hora;Plataforma;Importe;Entregado;Cambio;Propina;Efectivo neto',
  );
  expect(lines[1]).toBe('2026-11-02;09:15;Uber;18,50;20,00;1,00;0,50;19,00');
  expect(lines[lines.length - 1]).toBe('Total;;;28,50;;;0,50;29,00');
});

test('English CSV uses commas and decimal points', () => {
  const csv = buildCsv([records[0]], 'en', zone);
  expect(csv).toContain('2026-11-02,09:15,Uber,18.50,20.00,1.00,0.50,19.00');
});

test('month report totals match the operations', () => {
  const report = buildMonthReport(records, { year: 2026, month: 11 }, zone);
  expect(report.count).toBe(2);
  expect(report.fareTotalCents).toBe(1850 + 1000);
  expect(report.tipTotalCents).toBe(50);
  expect(report.days.map(d => [d.key, d.count])).toEqual([['2026-11-02', 2]]);
  expect(report.platforms.map(p => p.platform)).toEqual(['uber', 'bolt']);
});

test('backup round trip returns the same operations', () => {
  const text = buildBackup(records, new Date('2026-12-01T10:00:00.000Z'));
  const parsed = parseBackup(text);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) {
    expect(parsed.records).toHaveLength(4);
    expect(parsed.records.map(r => r.id).sort()).toEqual(
      records.map(r => r.id).sort(),
    );
  }
});

test('rejects files that are not a valid backup', () => {
  expect(parseBackup('not json')).toEqual({ ok: false, reason: 'format' });
  expect(parseBackup('{"app":"other","transactions":[]}')).toEqual({
    ok: false,
    reason: 'format',
  });
  expect(
    parseBackup('{"app":"cash-driver","version":9,"transactions":[]}'),
  ).toEqual({ ok: false, reason: 'version' });
});

test('rejects a backup with an inconsistent or duplicated operation', () => {
  const bad = (items: unknown[]) =>
    JSON.stringify({ app: 'cash-driver', version: 1, transactions: items });
  expect(parseBackup(bad([{ ...records[0], netCashCents: 5 }]))).toEqual({
    ok: false,
    reason: 'records',
  });
  expect(parseBackup(bad([records[0], records[0]]))).toEqual({
    ok: false,
    reason: 'records',
  });
  expect(
    parseBackup(bad([{ ...records[0], createdAt: '2026-11-02' }])),
  ).toEqual({ ok: false, reason: 'records' });
});

test('PDF report is a well-formed document with correct xref offsets', () => {
  const report = buildMonthReport(records, { year: 2026, month: 11 }, zone);
  const pdf = buildMonthPdf(
    report,
    {
      title: 'Informe de noviembre de 2026',
      generatedBy: 'Documento generado por Cash Driver',
      page: 'Página',
      operations: 'Operaciones',
      fares: 'Importe de viajes',
      tips: 'Propinas',
      netCash: 'Efectivo neto',
      average: 'Promedio por operación',
      byPlatform: 'Por plataforma',
      byDay: 'Por día',
      platform: 'Plataforma',
      day: 'Día',
      total: 'Total',
    },
    {
      money: cents => `${(cents / 100).toFixed(2).replace('.', ',')} €`,
      dayLabel: key => key,
    },
  );
  expect(pdf.startsWith('%PDF-1.4')).toBe(true);
  expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
  expect([...pdf].every(char => char.charCodeAt(0) < 128)).toBe(true);
  const xref = Number(/startxref\n(\d+)/.exec(pdf)?.[1]);
  expect(pdf.slice(xref, xref + 4)).toBe('xref');
  const offsets = [...pdf.matchAll(/(\d{10}) 00000 n /g)].map(m =>
    Number(m[1]),
  );
  offsets.forEach((offset, index) => {
    expect(pdf.slice(offset, offset + `${index + 1} 0 obj`.length)).toBe(
      `${index + 1} 0 obj`,
    );
  });
  expect(pdf).toContain('Cash Driver');
  expect(pdf).toContain('\\200'); // euro sign in WinAnsi
  expect(pdfToBase64(pdf).length).toBeGreaterThan(100);
});
