import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { CalendarModal } from './CalendarModal';
import { Calendar } from 'react-native-calendars';
import { CalendarDay } from './CalendarDay';
import { CalendarPeriodSelector } from '../CalendarPeriodSelector/CalendarPeriodSelector';
import { CalendarModalProps } from './CalendarModal.interface';
import { palettes as mockPalettes } from '../../constants/theme/tokens';
import {
  translate as mockTranslate,
  Language,
  locales as mockLocales,
} from '../../i18n/translations';

let mockLanguage: Language = 'en';
let mockDark = false;

jest.mock('../../providers/LanguageProvider/LanguageProvider', () => ({
  useTranslation: () => ({
    locale: mockLocales[mockLanguage],
    t: (key: Parameters<typeof mockTranslate>[1]) =>
      mockTranslate(mockLanguage, key),
  }),
}));
jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({
    colors: mockDark ? mockPalettes.dark : mockPalettes.light,
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let app: Renderer.ReactTestRenderer;
let props: CalendarModalProps;
beforeEach(() => {
  mockLanguage = 'en';
  mockDark = false;
  props = {
    draftMonth: { year: 2026, month: 10 },
    selectedDate: { year: 2026, month: 10, day: 10 },
    todayDateKey: '2026-10-11',
    occupiedDates: ['2026-10-10'],
    activityStatus: 'ready',
    onBrowseMonth: jest.fn(),
    onApplyMonth: jest.fn(),
    onApplyDay: jest.fn(),
    onCancel: jest.fn(),
    onRetryActivity: jest.fn(),
  };
});
afterEach(async () => {
  await act(async () => app?.unmount());
});
async function mount() {
  await act(async () => {
    app = Renderer.create(<CalendarModal {...props} />);
  });
}
test.each([false, true])(
  'month tiles highlight activity in dark theme %s while retaining selection',
  async dark => {
    mockDark = dark;
    props = {
      ...props,
      monthOnly: true,
      occupiedMonths: [2, 10],
      monthActivityStatus: 'ready',
    };
    await mount();
    const colors = dark ? mockPalettes.dark : mockPalettes.light;
    const tile = (month: number) =>
      app.root.findAll(
        node =>
          node.props.testID === `calendar-month-${month}` &&
          typeof node.props.onPress === 'function',
      )[0];
    const activity = tile(2).findAll(
      node => node.props.testID === 'calendar-month-activity',
    )[0];
    expect(StyleSheet.flatten(activity.props.style).backgroundColor).toBe(
      colors.softGreen,
    );
    expect(StyleSheet.flatten(activity.props.style).opacity.__getValue()).toBe(
      1,
    );
    expect(StyleSheet.flatten(tile(10).props.style).backgroundColor).toBe(
      colors.primary,
    );
    expect(StyleSheet.flatten(tile(3).props.style).backgroundColor).toBe(
      colors.background,
    );
    expect(tile(2).props.accessibilityHint).toBe(
      mockTranslate('en', 'calendarActivityLegend'),
    );
    props = { ...props, monthActivityStatus: 'error' };
    await act(async () => app.update(<CalendarModal {...props} />));
    expect(StyleSheet.flatten(tile(2).props.style).backgroundColor).toBe(
      colors.background,
    );
    expect(tile(2).props.accessibilityHint).toBe(
      mockTranslate('en', 'calendarActivityUnknown'),
    );
  },
);
function buttons() {
  return Array.from(
    new Map(
      app.root
        .findAll(
          node =>
            typeof node.props.onPress === 'function' &&
            (node.props.accessibilityRole === 'button' ||
              node.props.testID === 'calendar-backdrop'),
        )
        .map(node => [
          node.props.testID ?? node.props.accessibilityLabel,
          node,
        ]),
    ).values(),
  );
}
function button(label: string) {
  return buttons().find(node => node.props.accessibilityLabel === label)!;
}

test('month arrows retain six equal-height week rows and hide adjacent dates across four, five and six week months', async () => {
  props.draftMonth = { year: 2021, month: 2 };
  await mount();
  for (const [year, month, days] of [
    [2021, 2, 28],
    [2026, 10, 31],
    [2021, 5, 31],
    [2024, 2, 29],
  ]) {
    props = { ...props, draftMonth: { year, month } };
    await act(async () => app.update(<CalendarModal {...props} />));
    const calendar = app.root.findByType(Calendar);
    expect(calendar.props.showSixWeeks).toBe(false);
    expect(calendar.props.hideExtraDays).toBe(false);
    const cells = app.root.findAllByType(CalendarDay);
    expect(cells).toHaveLength(42);
    const placeholders = cells.filter(
      cell => cell.findAllByProps({ testID: 'calendar-empty-day' }).length > 0,
    );
    expect(placeholders).toHaveLength(42 - days);
    for (const cell of placeholders) {
      const placeholder = cell.findAllByProps({
        testID: 'calendar-empty-day',
      })[0];
      expect(placeholder.props.importantForAccessibility).toBe(
        'no-hide-descendants',
      );
      expect(placeholder.props.onPress).toBeUndefined();
      expect(StyleSheet.flatten(placeholder.props.style)).toEqual(
        expect.objectContaining({ minHeight: 48, opacity: 0 }),
      );
    }
    expect(
      app.root.findAllByProps({ testID: 'calendar-visible-heading' })[0].props
        .children,
    ).toBe(
      new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(year, month - 1, 1))),
    );
  }
});

test('real calendar exposes localized full dates, selection, activity and today independently', async () => {
  await mount();
  const days = buttons().filter(node =>
    node.props.accessibilityLabel?.includes('October 2026'),
  );
  expect(days).toHaveLength(31);
  const selected = days.find(node => node.props.accessibilityState?.selected)!;
  expect(selected.props.accessibilityLabel).toContain('With cash operations');
  const today = days.find(node =>
    node.props.accessibilityLabel.includes('Today'),
  )!;
  expect(today.props.accessibilityLabel).toContain('No cash operations');
  await act(async () => selected.props.onPress());
  expect(props.onApplyDay).toHaveBeenCalledWith({
    year: 2026,
    month: 10,
    day: 10,
  });
});
test('loading and failed activity keep days selectable and never claim no activity', async () => {
  props.activityStatus = 'loading';
  await mount();
  expect(
    buttons().some(node =>
      node.props.accessibilityLabel?.includes('No cash operations'),
    ),
  ).toBe(false);
  expect(
    buttons().filter(node =>
      node.props.accessibilityLabel?.includes('Activity not confirmed'),
    ),
  ).toHaveLength(31);
  props.activityStatus = 'error';
  await act(async () => app.update(<CalendarModal {...props} />));
  await act(async () =>
    buttons()
      .find(node => node.props.testID === 'calendar-activity-retry')!
      .props.onPress(),
  );
  expect(props.onRetryActivity).toHaveBeenCalledTimes(1);
});

test.each(['en', 'es', 'uk'] as Language[])(
  'header status reserves space across loading, error and success in %s',
  async language => {
    mockLanguage = language;
    props.activityStatus = 'loading';
    await mount();
    const footprint = () => ({
      track: app.root.findAll(
        node => node.props.testID === 'calendar-progress-track',
      )[0].props.style,
      footer: button(mockTranslate(language, 'calendarShowMonth')).props.style({
        pressed: false,
      }),
      close: app.root.findAll(node => node.props.testID === 'calendar-close')[0]
        .props.style,
    });
    const initial = footprint();
    props = { ...props, activityStatus: 'error' };
    await act(async () => app.update(<CalendarModal {...props} />));
    expect(footprint()).toEqual(initial);
    const retry = buttons().find(
      node => node.props.testID === 'calendar-activity-retry',
    )!;
    expect(retry.props.accessibilityLabel).toContain(
      mockTranslate(language, 'calendarActivityError'),
    );
    expect(
      StyleSheet.flatten(retry.props.style).minHeight,
    ).toBeGreaterThanOrEqual(48);
    props = { ...props, activityStatus: 'ready' };
    await act(async () => app.update(<CalendarModal {...props} />));
    expect(footprint()).toEqual(initial);
    expect(
      buttons().some(node => node.props.testID === 'calendar-activity-retry'),
    ).toBe(false);
  },
);

test('retained activity is announced as updating or unverified after an error', async () => {
  props = { ...props, activityHasData: true, activityStatus: 'loading' };
  await mount();
  const day = () =>
    buttons().find(node =>
      node.props.accessibilityLabel?.includes('10 October 2026'),
    )!;
  expect(day().props.accessibilityLabel).toContain(
    mockTranslate('en', 'dataRefreshing'),
  );
  expect(day().props.accessibilityLabel).toContain(
    mockTranslate('en', 'calendarActivityLegend'),
  );
  props = { ...props, activityStatus: 'error' };
  await act(async () => app.update(<CalendarModal {...props} />));
  expect(day().props.accessibilityLabel).toContain(
    mockTranslate('en', 'dataRefreshFailed'),
  );
});
test('browse, apply and every dismissal delegate separate controlled actions', async () => {
  await mount();
  await act(async () => button('Next month').props.onPress());
  expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2026, month: 11 });
  expect(props.onApplyMonth).not.toHaveBeenCalled();
  await act(async () => button('Show month').props.onPress());
  expect(props.onApplyMonth).toHaveBeenCalledWith(props.draftMonth);
  await act(async () => button('Cancel').props.onPress());
  await act(async () => app.root.findByType(Modal).props.onRequestClose());
  await act(async () =>
    buttons()
      .find(node => node.props.testID === 'calendar-backdrop')!
      .props.onPress(),
  );
  expect(props.onCancel).toHaveBeenCalledTimes(3);
});

test('header close and footer cancel discard the same draft without applying it', async () => {
  await mount();
  await act(async () => button('Next month').props.onPress());
  const cancellations = buttons().filter(
    node => node.props.accessibilityLabel === 'Cancel',
  );
  expect(cancellations).toHaveLength(2);
  for (const cancel of cancellations) {
    await act(async () => cancel.props.onPress());
  }
  expect(props.onCancel).toHaveBeenCalledTimes(2);
  expect(props.onApplyMonth).not.toHaveBeenCalled();
  expect(props.onApplyDay).not.toHaveBeenCalled();
});

test('controlled year and month drafts apply the chosen historical month without hidden navigation', async () => {
  await mount();
  expect(
    app.root.findAll(node => node.props.accessibilityRole === 'adjustable'),
  ).toHaveLength(0);
  await act(async () => button('Choose month and year').props.onPress());
  await act(async () => button('Next year').props.onPress());
  props.draftMonth = { year: 2027, month: 10 };
  await act(async () => app.update(<CalendarModal {...props} />));
  await act(async () => button('March').props.onPress());
  expect(props.onBrowseMonth).toHaveBeenLastCalledWith({
    year: 2027,
    month: 3,
  });
  props.draftMonth = { year: 2027, month: 3 };
  await act(async () => app.update(<CalendarModal {...props} />));
  expect(button('March').props.accessibilityState.selected).toBe(true);
  expect(props.onApplyMonth).not.toHaveBeenCalled();
  await act(async () => button('Show month').props.onPress());
  expect(props.onApplyMonth).toHaveBeenCalledWith({ year: 2027, month: 3 });
});
test('year/month chooser navigates drafts without applying, and closing resets chooser', async () => {
  await mount();
  expect(button('Choose month and year').props.accessibilityValue.text).toBe(
    'October 2026',
  );
  await act(async () => button('Choose month and year').props.onPress());
  expect(button('Show days').props.accessibilityValue.text).toBe('2026');
  await act(async () => button('Next year').props.onPress());
  expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2027, month: 10 });
  await act(async () => button('March').props.onPress());
  expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2026, month: 3 });
  expect(props.onApplyMonth).not.toHaveBeenCalled();
  await act(async () =>
    app.update(<CalendarModal {...props} draftMonth={null} />),
  );
  await act(async () => app.update(<CalendarModal {...props} />));
  expect(button('Choose month and year')).toBeDefined();
});
test('compact selector exposes direct navigation and return from day', async () => {
  const move = jest.fn();
  const open = jest.fn();
  const returnToMonth = jest.fn();
  await act(async () => {
    app = Renderer.create(
      <CalendarPeriodSelector
        selection={{
          kind: 'day',
          month: { year: 2026, month: 10 },
          date: { year: 2026, month: 10, day: 10 },
        }}
        onMoveMonth={move}
        onOpenCalendar={open}
        onReturnToMonth={returnToMonth}
      />,
    );
  });
  await act(async () => button('Previous month').props.onPress());
  await act(async () => button('Open calendar').props.onPress());
  await act(async () => button('Return to month').props.onPress());
  expect(move).toHaveBeenCalledWith(-1);
  expect(open).toHaveBeenCalledTimes(1);
  expect(returnToMonth).toHaveBeenCalledTimes(1);
});

test('locale and theme changes preserve the open year/month chooser and draft coordinates', async () => {
  await mount();
  await act(async () => button('Choose month and year').props.onPress());
  mockLanguage = 'uk';
  mockDark = true;
  await act(async () => app.update(<CalendarModal {...props} />));
  expect(button(mockTranslate('uk', 'calendarShowDays'))).toBeDefined();
  await act(async () =>
    button(mockTranslate('uk', 'calendarNextYear')).props.onPress(),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2027, month: 10 });
  expect(props.onApplyMonth).not.toHaveBeenCalled();
});

test('a selected occupied today announces all three independent statuses', async () => {
  props.todayDateKey = '2026-10-10';
  await mount();
  const selected = buttons().find(
    node => node.props.accessibilityState?.selected,
  )!;
  expect(selected.props.accessibilityLabel).toContain('With cash operations');
  expect(selected.props.accessibilityLabel).toContain('Today');
  expect(selected.props.accessibilityLabel).toContain('Selected');
});

test('native modal onShow requests initial heading focus only after the dialog is shown', async () => {
  jest.useFakeTimers();
  const native = require('react-native');
  const focus = jest
    .spyOn(native.AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(() => {});
  try {
    props.monthOnly = true;
    await mount();
    expect(focus).not.toHaveBeenCalled();
    const onShow = app.root.findByType(Modal).props.onShow;
    await act(async () => onShow());
    expect(focus).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(30));
    expect(focus).toHaveBeenCalledWith(expect.anything(), 'focus');
    focus.mockClear();
    await act(async () => onShow());
    await act(async () => app.unmount());
    await act(async () => jest.advanceTimersByTime(30));
    expect(focus).not.toHaveBeenCalled();
    focus.mockClear();
    await act(async () => {
      onShow();
      jest.advanceTimersByTime(30);
    });
    expect(focus).not.toHaveBeenCalled();
  } finally {
    focus.mockRestore();
    jest.useRealTimers();
  }
});

test.each([false, true])(
  'selected occupied today keeps independent visual markers (dark=%s)',
  async dark => {
    mockDark = dark;
    props.todayDateKey = '2026-10-10';
    await mount();
    const selected = buttons().find(
      node => node.props.accessibilityState?.selected,
    )!;
    const colors = dark ? mockPalettes.dark : mockPalettes.light;
    const surfaces = selected
      .findAllByType(View)
      .map(node => StyleSheet.flatten(node.props.style));
    expect(surfaces.some(style => style?.borderColor === colors.primary)).toBe(
      true,
    );
    expect(
      surfaces.some(style => style?.backgroundColor === colors.primary),
    ).toBe(true);
    const dot = selected.findAll(
      node => node.props.testID === 'calendar-activity-2026-10-10',
    )[0];
    expect(StyleSheet.flatten(dot.props.style).backgroundColor).toBe(
      colors.onPrimary,
    );
  },
);
