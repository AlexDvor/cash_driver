import React from 'react';
import * as Native from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { CalendarNavigation } from '../src/components/CalendarNavigation/CalendarNavigation';
import { CalendarModal } from '../src/components/CalendarModal/CalendarModal';
import { CalendarPeriodSelector } from '../src/components/CalendarPeriodSelector/CalendarPeriodSelector';
import { useCalendarSelection } from '../src/hooks/summary/useCalendarSelection';
import { palettes as mockPalettes } from '../src/constants/theme/tokens';
import { translate as mockTranslate } from '../src/i18n/translations';

const mockActivity = jest.fn();
jest.mock('../src/hooks/summary/useOccupiedDates', () => ({
  useOccupiedDates: (...args: unknown[]) => mockActivity(...args),
}));
jest.mock('../src/providers/LanguageProvider/LanguageProvider', () => ({
  useTranslation: () => ({
    locale: 'en-GB',
    t: (key: Parameters<typeof mockTranslate>[1]) => mockTranslate('en', key),
  }),
}));
jest.mock('../src/providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

test('shared composition loads draft activity, applies a day, and restores trigger focus on cancel', async () => {
  jest.useFakeTimers();
  const focus = jest
    .spyOn(Native.AccessibilityInfo, 'setAccessibilityFocus')
    .mockImplementation(() => {});
  jest.spyOn(require('react-native'), 'findNodeHandle').mockReturnValue(42);
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => {
    callback(0);
    return 1;
  });
  const retry = jest.fn();
  mockActivity.mockReturnValue({
    state: { status: 'loading', dates: null },
    retry,
  });
  let app!: Renderer.ReactTestRenderer;
  let calendar!: ReturnType<typeof useCalendarSelection>;
  function Probe() {
    calendar = useCalendarSelection({
      now: new Date('2026-10-11T10:00:00Z'),
      timeZone: 'UTC',
      dayKey: '2026-10-11',
    });
    return (
      <CalendarNavigation
        calendar={calendar}
        timeZone="UTC"
        todayDateKey="2026-10-11"
      />
    );
  }
  try {
    await act(async () => {
      app = Renderer.create(<Probe />);
    });
    expect(mockActivity).toHaveBeenLastCalledWith(
      { year: 2026, month: 10 },
      'UTC',
      false,
    );
    await act(async () =>
      app.root.findByType(CalendarPeriodSelector).props.onOpenCalendar(),
    );
    expect(mockActivity).toHaveBeenLastCalledWith(
      { year: 2026, month: 10 },
      'UTC',
      true,
    );
    await act(async () =>
      app.root
        .findByType(CalendarModal)
        .props.onBrowseMonth({ year: 2020, month: 2 }),
    );
    expect(calendar.selection.kind).toBe('automatic');
    expect(mockActivity).toHaveBeenLastCalledWith(
      { year: 2020, month: 2 },
      'UTC',
      true,
    );
    expect(app.root.findByType(CalendarModal).props.activityStatus).toBe(
      'loading',
    );
    expect(app.root.findByType(CalendarModal).props.occupiedDates).toEqual([]);
    await act(async () =>
      app.root.findByType(CalendarModal).props.onRetryActivity(),
    );
    expect(retry).toHaveBeenCalledTimes(1);
    await act(async () => app.root.findByType(CalendarModal).props.onCancel());
    await act(async () => jest.advanceTimersByTime(20));
    expect(focus).toHaveBeenCalledWith(42);
    expect(calendar.selection.kind).toBe('automatic');
    await act(async () => calendar.openCalendar());
    await act(async () =>
      app.root
        .findByType(CalendarModal)
        .props.onApplyDay({ year: 2026, month: 10, day: 10 }),
    );
    expect(calendar.selection.kind).toBe('day');
    expect(calendar.draftMonth).toBeNull();
    expect(mockActivity).toHaveBeenLastCalledWith(
      { year: 2026, month: 10 },
      'UTC',
      false,
    );
  } finally {
    await act(async () => app?.unmount());
    jest.restoreAllMocks();
    jest.useRealTimers();
  }
});
