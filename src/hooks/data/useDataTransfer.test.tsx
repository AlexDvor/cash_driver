import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { useDataTransfer } from './useDataTransfer';
import { Persistence } from '../../app/persistence';
import {
  openTestDatabase,
  testPersistence,
} from '../../test/sqliteTestDatabase';
import { CashTransaction } from '../../features/transactions/types';
import { buildBackup } from '../../features/export/exportData';

let mockServices: Persistence;
const mockSaveFile = jest.fn();
const mockPickTextFile = jest.fn();
let mockLanguage: 'es' | 'en' = 'es';

jest.mock('../../providers/PersistenceProvider/PersistenceProvider', () => ({
  usePersistenceServices: () => ({ services: mockServices }),
}));
jest.mock('../../providers/LanguageProvider/LanguageProvider', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
    language: mockLanguage,
    locale: mockLanguage === 'es' ? 'es-ES' : 'en-GB',
  }),
}));
jest.mock('../../features/export/exportFiles', () => ({
  saveFile: (...args: unknown[]) => mockSaveFile(...args),
  pickTextFile: () => mockPickTextFile(),
}));

function record(n: number, createdAt: string): CashTransaction {
  return {
    id: `cccccccc-0000-4000-8000-${String(n).padStart(12, '0')}`,
    platform: 'uber',
    fareAmountCents: 1850,
    cashReceivedCents: 2000,
    changeGivenCents: 100,
    tipCents: 50,
    netCashCents: 1900,
    createdAt,
    updatedAt: null,
  };
}

let current!: ReturnType<typeof useDataTransfer>;
let app: Renderer.ReactTestRenderer;

function Probe() {
  current = useDataTransfer();
  return null;
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-23T10:00:00Z'));
  mockLanguage = 'es';
  mockSaveFile.mockReset();
  mockPickTextFile.mockReset();
  mockServices = await testPersistence(openTestDatabase());
  await act(async () => {
    app = Renderer.create(<Probe />);
  });
});

afterEach(() => {
  act(() => app.unmount());
  jest.useRealTimers();
});

async function seed() {
  await mockServices.transactions.importRecords([
    record(1, '2026-11-02T08:15:00.000Z'),
    record(2, '2026-11-03T09:00:00.000Z'),
    record(3, '2026-10-20T09:00:00.000Z'),
  ]);
}

test('lists months that have operations, newest first', async () => {
  await seed();
  let months: Awaited<ReturnType<typeof current.loadMonths>> = null;
  await act(async () => {
    months = await current.loadMonths();
  });
  expect(months).toEqual([
    { year: 2026, month: 11, count: 2 },
    { year: 2026, month: 10, count: 1 },
  ]);
});

test('saves a backup with every stored operation', async () => {
  await seed();
  mockSaveFile.mockResolvedValue('saved');
  await act(async () => {
    await current.saveBackup();
  });
  const call = mockSaveFile.mock.calls[0][0];
  expect(call.fileName).toBe('cashdriver-copia-2026-11-23.json');
  expect(call.mimeType).toBe('application/json');
  expect(JSON.parse(call.content).count).toBe(3);
  expect(current.message).toEqual({ kind: 'success', text: 'exportSaved' });
});

test('an empty database has nothing to back up', async () => {
  await act(async () => {
    await current.saveBackup();
  });
  expect(mockSaveFile).not.toHaveBeenCalled();
  expect(current.message).toEqual({ kind: 'error', text: 'noDataToExport' });
});

test('cancelling the save dialog shows no message', async () => {
  await seed();
  mockSaveFile.mockResolvedValue('cancelled');
  await act(async () => {
    await current.saveBackup();
  });
  expect(current.message).toBeNull();
});

test('a failing save reports an error and releases the busy state', async () => {
  await seed();
  mockSaveFile.mockRejectedValue(new Error('disk full'));
  await act(async () => {
    await current.saveBackup();
  });
  expect(current.message).toEqual({ kind: 'error', text: 'exportFailed' });
  expect(current.busy).toBe(false);
});

test('exports one month as CSV with only that month', async () => {
  await seed();
  mockSaveFile.mockResolvedValue('saved');
  await act(async () => {
    await current.exportMonth({ year: 2026, month: 11 }, 'csv');
  });
  const call = mockSaveFile.mock.calls[0][0];
  expect(call.fileName).toBe('cashdriver-2026-11.csv');
  expect(call.encoding).toBe('utf8');
  const lines = call.content.replace('﻿', '').trim().split('\r\n');
  expect(lines).toHaveLength(4); // header, two operations, total
  expect(lines[3]).toBe('Total;;;37,00;;;1,00;38,00');
});

test('exports one month as a base64 PDF', async () => {
  await seed();
  mockSaveFile.mockResolvedValue('saved');
  await act(async () => {
    await current.exportMonth({ year: 2026, month: 11 }, 'pdf');
  });
  const call = mockSaveFile.mock.calls[0][0];
  expect(call.fileName).toBe('cashdriver-informe-2026-11.pdf');
  expect(call.mimeType).toBe('application/pdf');
  expect(call.encoding).toBe('base64');
  expect(atob(call.content).startsWith('%PDF-1.4')).toBe(true);
});

test('English exports use English CSV headers', async () => {
  mockLanguage = 'en';
  await seed();
  mockSaveFile.mockResolvedValue('saved');
  await act(async () => {
    app.update(<Probe />);
  });
  await act(async () => {
    await current.exportMonth({ year: 2026, month: 11 }, 'csv');
  });
  expect(mockSaveFile.mock.calls[0][0].content).toContain(
    'Date,Time,Platform,Fare',
  );
});

test('rejects a file that is not a Cash Driver backup', async () => {
  mockPickTextFile.mockResolvedValue('{"hello":"world"}');
  let preview: unknown = 'unset';
  await act(async () => {
    preview = await current.chooseBackup();
  });
  expect(preview).toBeNull();
  expect(current.message).toEqual({ kind: 'error', text: 'restoreInvalid' });
});

test('cancelling the file picker does nothing', async () => {
  mockPickTextFile.mockResolvedValue(null);
  let preview: unknown = 'unset';
  await act(async () => {
    preview = await current.chooseBackup();
  });
  expect(preview).toBeNull();
  expect(current.message).toBeNull();
});

test('restores a backup: preview first, then only missing operations are added', async () => {
  await seed();
  const backup = buildBackup(
    [
      record(1, '2026-11-02T08:15:00.000Z'),
      record(4, '2026-09-10T07:00:00.000Z'),
    ],
    new Date('2026-11-23T10:00:00Z'),
  );
  mockPickTextFile.mockResolvedValue(backup);
  let preview!: NonNullable<Awaited<ReturnType<typeof current.chooseBackup>>>;
  await act(async () => {
    preview = (await current.chooseBackup())!;
  });
  expect(preview.records).toHaveLength(2);
  expect(preview.from).toContain('2026');
  // Choosing a file must not write anything yet.
  expect(await mockServices.transactions.list()).toHaveLength(3);

  await act(async () => {
    await current.restore(preview.records);
  });
  expect(await mockServices.transactions.list()).toHaveLength(4);
  expect(current.message).toEqual({
    kind: 'success',
    text: 'restoreDone:{"inserted":"1","skipped":"1"}',
  });
});

test('restoring a backup with nothing new says so', async () => {
  await seed();
  const all = await mockServices.transactions.list();
  await act(async () => {
    await current.restore(all);
  });
  expect(current.message).toEqual({
    kind: 'success',
    text: 'restoreNothingNew',
  });
});

test('a conflicting operation is reported and the stored one is kept', async () => {
  await seed();
  const conflicting: CashTransaction = {
    ...record(1, '2026-11-02T08:15:00.000Z'),
    fareAmountCents: 999,
    cashReceivedCents: 1000,
    changeGivenCents: 1,
    tipCents: 0,
    netCashCents: 999,
  };
  await act(async () => {
    await current.restore([conflicting]);
  });
  expect(current.message?.kind).toBe('error');
  expect(current.message?.text).toContain('restoreConflicts');
  const kept = await mockServices.transactions.get(conflicting.id);
  expect(kept?.fareAmountCents).toBe(1850);
});

test('ignores a second action while one is running', async () => {
  await seed();
  let release!: (value: string) => void;
  mockSaveFile.mockReturnValueOnce(
    new Promise<string>(resolve => {
      release = resolve;
    }),
  );
  let first!: Promise<void>;
  await act(async () => {
    first = current.saveBackup();
  });
  expect(current.busy).toBe(true);
  await act(async () => {
    await current.saveBackup();
  });
  expect(mockSaveFile).toHaveBeenCalledTimes(1);
  await act(async () => {
    release('saved');
    await first;
  });
  expect(current.busy).toBe(false);
});
