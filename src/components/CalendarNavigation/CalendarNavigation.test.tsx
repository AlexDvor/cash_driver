import React from 'react';
import * as Native from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarModal } from '../CalendarModal/CalendarModal';
import { CalendarPeriodSelector } from '../CalendarPeriodSelector/CalendarPeriodSelector';
import {
  useCalendarSelection,
  CalendarSelection,
} from '../../hooks/summary/useCalendarSelection';
import { palettes as mockPalettes } from '../../constants/theme/tokens';
import { translate as mockTranslate } from '../../i18n/translations';

const mockActivity = jest.fn();
const mockMonthActivity = jest.fn().mockReturnValue({
  state: { status: 'ready', months: [] },
  retry: jest.fn(),
});
jest.mock('../../hooks/summary/useOccupiedMonths', () => ({
  useOccupiedMonths: (...args: unknown[]) => mockMonthActivity(...args),
}));
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockFocused,
}));
jest.mock('../../hooks/summary/useOccupiedDates', () => ({
  useOccupiedDates: (...args: unknown[]) => mockActivity(...args),
}));
jest.mock('../../providers/LanguageProvider/LanguageProvider', () => ({
  useTranslation: () => ({
    locale: 'en-GB',
    t: (key: Parameters<typeof mockTranslate>[1]) => mockTranslate('en', key),
  }),
}));
jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

test('automatic and explicit months retain the same responsive row and reserve all month-label heights', async () => {
  let selection: CalendarSelection = {
    kind: 'automatic',
    month: { year: 2021, month: 2 },
  };
  const trigger = React.createRef<React.ElementRef<typeof Native.View>>();
  const render = () => (
    <CalendarPeriodSelector
      selection={selection}
      onMoveMonth={jest.fn()}
      onOpenCalendar={jest.fn()}
      onReturnToMonth={jest.fn()}
      calendarButtonRef={trigger}
    />
  );
  let app!: Renderer.ReactTestRenderer;
  try {
    await act(async () => {
      app = Renderer.create(render());
    });
    await act(async () =>
      app.root
        .find(node => typeof node.props.onLayout === 'function')
        .props.onLayout({
          nativeEvent: {
            layout: { width: 290 * Native.Dimensions.get('window').fontScale },
          },
        }),
    );
    const control = () =>
      app.root.find(
        node =>
          node.props.accessibilityLabel ===
            mockTranslate('en', 'calendarOpen') &&
          typeof node.props.onPress === 'function',
      );
    const initial = Native.StyleSheet.flatten(
      control().props.style({ pressed: false }),
    );
    selection = { kind: 'month', month: { year: 2021, month: 9 } };
    await act(async () => {
      app.update(render());
    });
    expect(
      Native.StyleSheet.flatten(control().props.style({ pressed: false })),
    ).toEqual(initial);
    const measure = app.root.findAllByProps({
      testID: 'calendar-period-label-measure',
    })[0];
    expect(measure.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(measure.props.children).toHaveLength(12);
    expect(
      app.root.findAllByProps({ testID: 'calendar-period-visible-label' })[0]
        .props.children,
    ).toBe('September 2021');
  } finally {
    await act(async () => app?.unmount());
  }
});

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
        .find(
          node =>
            node.props.accessibilityLabel ===
              mockTranslate('en', 'calendarSelectMonthYear') &&
            typeof node.props.onPress === 'function',
        )
        .props.onPress(),
    );
    expect(mockActivity).toHaveBeenLastCalledWith(
      { year: 2026, month: 10 },
      'UTC',
      false,
    );
    expect(mockMonthActivity).toHaveBeenLastCalledWith(2026, 'UTC', true);
    await act(async () =>
      app.root
        .find(
          node =>
            node.props.accessibilityLabel ===
              mockTranslate('en', 'calendarShowDays') &&
            typeof node.props.onPress === 'function',
        )
        .props.onPress(),
    );
    expect(mockMonthActivity).toHaveBeenLastCalledWith(2026, 'UTC', false);
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
