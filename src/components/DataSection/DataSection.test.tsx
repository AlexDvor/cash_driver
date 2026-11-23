import React from 'react';
import { Alert } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { DataSection } from './DataSection';

const mockData = {
  busy: false,
  message: null as { kind: 'success' | 'error'; text: string } | null,
  clearMessage: jest.fn(),
  monthLabel: (m: { year: number; month: number }) => `M${m.year}-${m.month}`,
  loadMonths: jest.fn(),
  exportMonth: jest.fn(),
  saveBackup: jest.fn(),
  chooseBackup: jest.fn(),
  restore: jest.fn(),
};

jest.mock('../../hooks/data/useDataTransfer', () => ({
  useDataTransfer: () => mockData,
}));
jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({
    colors: require('../../constants/theme/tokens').palettes.dark,
  }),
}));
jest.mock('../../providers/LanguageProvider/LanguageProvider', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
    language: 'es',
    locale: 'es-ES',
  }),
}));

let app: Renderer.ReactTestRenderer;

async function mount() {
  await act(async () => {
    app = Renderer.create(<DataSection />);
  });
}

function byId(testID: string) {
  return app.root.findByProps({ testID });
}

async function press(testID: string) {
  await act(async () => {
    await byId(testID).props.onPress();
  });
}

beforeEach(() => {
  mockData.busy = false;
  mockData.message = null;
  Object.values(mockData).forEach(value => {
    if (jest.isMockFunction(value)) {
      value.mockReset();
    }
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  act(() => app.unmount());
  jest.restoreAllMocks();
});

test('shows the three data actions', async () => {
  await mount();
  expect(byId('data-export-month')).toBeTruthy();
  expect(byId('data-backup-save')).toBeTruthy();
  expect(byId('data-backup-restore')).toBeTruthy();
});

test('backup button saves a backup', async () => {
  await mount();
  await press('data-backup-save');
  expect(mockData.saveBackup).toHaveBeenCalledTimes(1);
});

test('export: choose a month, then a format', async () => {
  mockData.loadMonths.mockResolvedValue([
    { year: 2026, month: 11, count: 108 },
    { year: 2026, month: 10, count: 137 },
  ]);
  mockData.exportMonth.mockResolvedValue(true);
  await mount();
  await press('data-export-month');
  expect(() => byId('data-month-2026-11')).not.toThrow();
  expect(() => byId('data-month-2026-10')).not.toThrow();
  expect(() => byId('data-format-pdf')).toThrow();

  await press('data-month-2026-11');
  expect(() => byId('data-format-pdf')).not.toThrow();
  expect(() => byId('data-format-csv')).not.toThrow();

  await press('data-format-pdf');
  expect(mockData.exportMonth).toHaveBeenCalledWith(
    { year: 2026, month: 11, count: 108 },
    'pdf',
  );
  // The sheet closes once an export starts.
  expect(() => byId('data-format-pdf')).toThrow();
});

test('export as CSV passes the csv format', async () => {
  mockData.loadMonths.mockResolvedValue([{ year: 2026, month: 11, count: 2 }]);
  await mount();
  await press('data-export-month');
  await press('data-month-2026-11');
  await press('data-format-csv');
  expect(mockData.exportMonth).toHaveBeenCalledWith(
    { year: 2026, month: 11, count: 2 },
    'csv',
  );
});

test('with no operations an alert explains there is nothing to export', async () => {
  mockData.loadMonths.mockResolvedValue([]);
  await mount();
  await press('data-export-month');
  expect(Alert.alert).toHaveBeenCalledWith('exportMonth', 'noDataToExport');
  expect(() => byId('data-month-2026-11')).toThrow();
});

test('a failed month load opens nothing', async () => {
  mockData.loadMonths.mockResolvedValue(null);
  await mount();
  await press('data-export-month');
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('restore asks for confirmation and only then writes', async () => {
  const records = [{ id: 'x' }, { id: 'y' }];
  mockData.chooseBackup.mockResolvedValue({
    records,
    from: '24 nov 2025',
    to: '23 nov 2026',
  });
  await mount();
  await press('data-backup-restore');
  expect(mockData.restore).not.toHaveBeenCalled();
  const [title, text, buttons] = (Alert.alert as jest.Mock).mock.calls[0];
  expect(title).toBe('backupRestore');
  expect(text).toContain('"count":"2"');
  expect(text).toContain('24 nov 2025');
  const confirm = buttons.find(
    (button: { text: string }) => button.text === 'restoreConfirm',
  );
  await act(async () => {
    confirm.onPress();
  });
  expect(mockData.restore).toHaveBeenCalledWith(records);
});

test('cancelling the restore confirmation writes nothing', async () => {
  mockData.chooseBackup.mockResolvedValue({
    records: [{ id: 'x' }],
    from: 'a',
    to: 'b',
  });
  await mount();
  await press('data-backup-restore');
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
  expect(
    buttons.find((button: { text: string }) => button.text === 'cancel').style,
  ).toBe('cancel');
  expect(mockData.restore).not.toHaveBeenCalled();
});

test('no confirmation when no file was chosen', async () => {
  mockData.chooseBackup.mockResolvedValue(null);
  await mount();
  await press('data-backup-restore');
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('buttons are disabled while an action is running', async () => {
  mockData.busy = true;
  await mount();
  expect(byId('data-export-month').props.disabled).toBe(true);
  expect(byId('data-backup-save').props.disabled).toBe(true);
  expect(byId('data-backup-restore').props.disabled).toBe(true);
});

test('shows the result message', async () => {
  mockData.message = { kind: 'error', text: 'restoreInvalid' };
  await mount();
  const message = byId('data-message');
  expect(message.props.children).toBe('restoreInvalid');
  expect(message.props.accessibilityRole).toBe('alert');
});
