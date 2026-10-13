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
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockFocused,
}));
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

test('the central month control exposes the date and opens the chooser while arrows request adjacent months', async () => {
  const onMoveMonth = jest.fn();
  const onOpenCalendar = jest.fn();
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <CalendarPeriodSelector
        selection={{ kind: 'month', month: { year: 2026, month: 10 } }}
        onMoveMonth={onMoveMonth}
        onOpenCalendar={onOpenCalendar}
        onReturnToMonth={jest.fn()}
        calendarButtonRef={React.createRef<
          React.ElementRef<typeof Native.View>
        >()}
      />,
    );
  });
  const control = (label: string) =>
    app.root.find(
      node =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    );
  const open = control(mockTranslate('en', 'calendarOpen'));
  expect(open.props.accessibilityValue.text).toBe('October 2026');
  await act(async () => {
    open.props.onPress();
    control(mockTranslate('en', 'calendarPreviousMonth')).props.onPress();
    control(mockTranslate('en', 'calendarNextMonth')).props.onPress();
  });
  expect(onOpenCalendar).toHaveBeenCalledTimes(1);
  expect(onMoveMonth.mock.calls).toEqual([[-1], [1]]);
  expect(open.props.accessibilityValue.text).toBe('October 2026');
  await act(async () => app.unmount());
});

test('shared composition loads draft activity, applies a day, and restores trigger focus on cancel', async () => {
  mockFocused = true;
  jest.useFakeTimers();
  const focus = jest
    .spyOn(Native.AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(() => {});
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
    const priorFocusCalls = focus.mock.calls.length;
    await act(async () => calendar.openCalendar());
    mockFocused = false;
    await act(async () => app.update(<Probe />));
    await act(async () => calendar.cancelCalendar());
    await act(async () => jest.advanceTimersByTime(30));
    expect(focus).toHaveBeenCalledTimes(priorFocusCalls);
    mockFocused = true;
    await act(async () => app.update(<Probe />));
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
    expect(focus).toHaveBeenCalledWith(expect.anything(), 'focus');
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
