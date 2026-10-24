import React from 'react';
import { Modal, Platform, StyleSheet, View, ScrollView } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { CalendarModal } from './CalendarModal';
import { Calendar } from 'react-native-calendars';
import { CalendarDay } from './CalendarDay';
import { CalendarPeriodSelector } from '../CalendarPeriodSelector/CalendarPeriodSelector';
import { CalendarModalProps } from './CalendarModal.interface';
import { calendarMonthLabel } from './calendarPresentation';
import { palettes as mockPalettes } from '../../constants/theme/tokens';
import {
  translate as mockTranslate,
  Language,
  locales as mockLocales,
} from '../../i18n/translations';

let mockLanguage: Language = 'en';
let mockDark = false;
let mockReduced = true;

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
jest.mock('../../hooks/app/useCalendarMotion', () => ({
  useCalendarMotion: () => ({ reduced: mockReduced, active: true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let app: Renderer.ReactTestRenderer;
let props: CalendarModalProps;
beforeEach(() => {
  mockLanguage = 'en';
  mockDark = false;
  mockReduced = true;
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
async function endDrag(x: number) {
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-page-track' })[0]
      .props.onScrollEndDrag({ nativeEvent: { contentOffset: { x } } }),
  );
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
function isVisible(node: Renderer.ReactTestInstance) {
  let parent: Renderer.ReactTestInstance | null = node;
  while (parent) {
    if (
      ['calendar-previous-preview', 'calendar-next-preview'].includes(
        parent.props.testID,
      )
    )
      return false;
    parent = parent.parent;
  }
  return true;
}
function currentPage() {
  return app.root.findAllByProps({ testID: 'calendar-current-page' })[0];
}
function buttons() {
  return Array.from(
    new Map(
      app.root
        .findAll(
          node =>
            isVisible(node) &&
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

test('native pager browses draft months, protects previews and retains overflow scrolling', async () => {
  const surface = () =>
    app.root.findAllByProps({ testID: 'calendar-swipe-surface' })[0];
  const layout = async (width: number) =>
    act(async () =>
      surface().props.onLayout({ nativeEvent: { layout: { width } } }),
    );
  const beginSwipe = async () =>
    act(async () => {
      app.root
        .findAllByProps({ testID: 'calendar-page-track' })[0]
        .props.onScrollBeginDrag();
    });
  const release = async (dx: number) => {
    await endDrag(dx < 0 ? 1400 : 0);
    await act(async () => {
      app.root
        .findAllByProps({ testID: 'calendar-page-track' })[0]
        .props.onMomentumScrollEnd({
          nativeEvent: { contentOffset: { x: dx < 0 ? 1400 : 0 } },
        });
    });
  };
  await mount();
  await layout(700);
  const lateDayPress = currentPage()
    .findAllByType(CalendarDay)
    .find(node => node.props.date?.dateString === '2026-10-10')!
    .findAll(node => typeof node.props.onPress === 'function')[0].props.onPress;
  expect(
    app.root.findAllByType(ScrollView).filter(node => node.props.horizontal),
  ).toHaveLength(1);
  await beginSwipe();
  await act(async () => lateDayPress());
  expect(props.onApplyDay).not.toHaveBeenCalled();
  for (const id of ['calendar-previous-preview', 'calendar-next-preview']) {
    const preview = app.root.findAllByProps({ testID: id })[0];
    expect(preview.props.pointerEvents).toBe('none');
    expect(preview.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(
      preview
        .findAllByType(CalendarDay)
        .filter(node => node.props.date)
        .some(node =>
          node
            .findAllByType(View)
            .some(
              view =>
                view.props.testID?.startsWith('calendar-activity-') &&
                StyleSheet.flatten(view.props.style).backgroundColor ===
                  mockPalettes.light.primary,
            ),
        ),
    ).toBe(false);
  }
  await release(-240);
  expect(props.onBrowseMonth).toHaveBeenLastCalledWith({
    year: 2026,
    month: 11,
  });
  expect(props.onApplyDay).not.toHaveBeenCalled();
  expect(props.onApplyMonth).not.toHaveBeenCalled();
  expect(
    app.root.findAllByProps({ testID: 'calendar-close' })[0].props.disabled,
  ).not.toBe(true);
  expect(button('Next month').props.disabled).toBe(true);
  props = { ...props, draftMonth: { year: 2026, month: 12 } };
  await act(async () => app.update(<CalendarModal {...props} />));
  await beginSwipe();
  await release(-240);
  expect(props.onBrowseMonth).toHaveBeenLastCalledWith({
    year: 2027,
    month: 1,
  });
  props = { ...props, draftMonth: { year: 2026, month: 1 } };
  await act(async () => app.update(<CalendarModal {...props} />));
  await beginSwipe();
  await release(240);
  expect(props.onBrowseMonth).toHaveBeenLastCalledWith({
    year: 2025,
    month: 12,
  });
  await layout(200);
  expect(
    app.root.findAllByType(ScrollView).some(node => node.props.horizontal),
  ).toBe(true);
  expect(surface().props.onMoveShouldSetResponderCapture).toBeUndefined();
  const heading = app.root.findAllByProps({
    testID: 'calendar-month-swipe-heading',
  })[0];
  expect(typeof heading.props.onTouchStart).toBe('function');
  expect(typeof heading.props.onTouchEnd).toBe('function');
  await act(async () =>
    button(mockTranslate('en', 'calendarSelectMonthYear')).props.onPress(),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(3);
});

test('native month paging blocks day taps and commits exactly one adjacent draft', async () => {
  await mount();
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
      .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
  );
  const track = () =>
    app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
  const lateDayPress = currentPage()
    .findAllByType(CalendarDay)
    .find(node => node.props.date?.dateString === '2026-10-10')!
    .findAll(node => typeof node.props.onPress === 'function')[0].props.onPress;
  expect(track().props.pagingEnabled).toBe(true);
  expect(track().props.snapToInterval).toBeUndefined();
  expect(track().props.disableIntervalMomentum).toBeUndefined();
  expect(track().props.contentOffset.x).toBe(700);
  await act(async () => track().props.onScrollBeginDrag());
  await act(async () => lateDayPress());
  expect(props.onApplyDay).not.toHaveBeenCalled();
  expect(button('Next month').props.disabled).toBe(true);
  await endDrag(1400);
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 1400 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  expect(props.onBrowseMonth).toHaveBeenCalledWith({
    year: 2026,
    month: 11,
  });
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 1400 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  props = { ...props, draftMonth: { year: 2026, month: 11 } };
  await act(async () => app.update(<CalendarModal {...props} />));
  expect(button('Next month').props.disabled).toBe(false);
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 1400 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  await act(async () => track().props.onScrollBeginDrag());
  await endDrag(0);
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 0 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenLastCalledWith({
    year: 2026,
    month: 10,
  });
  expect(props.onApplyDay).not.toHaveBeenCalled();
});

test('visible month heading follows the grid before draft commit and rolls back with a cancelled swipe', async () => {
  await mount();
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
      .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
  );
  const heading = () =>
    app.root.findAllByProps({ testID: 'calendar-visible-heading' })[0].props
      .children;
  const track = () =>
    app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
  const october = calendarMonthLabel({ year: 2026, month: 10 }, mockLocales.en);
  const november = calendarMonthLabel(
    { year: 2026, month: 11 },
    mockLocales.en,
  );
  expect(heading()).toBe(october);
  await act(async () => track().props.onScrollBeginDrag());
  await act(async () =>
    track().props.onScroll({ nativeEvent: { contentOffset: { x: 1100 } } }),
  );
  expect(heading()).toBe(november);
  expect(props.onBrowseMonth).not.toHaveBeenCalled();
  await act(async () =>
    track().props.onScroll({ nativeEvent: { contentOffset: { x: 700 } } }),
  );
  expect(heading()).toBe(october);
  await endDrag(700);
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 700 } },
    }),
  );
  expect(props.onBrowseMonth).not.toHaveBeenCalled();
  props = { ...props, draftMonth: { year: 2026, month: 12 } };
  await act(async () => app.update(<CalendarModal {...props} />));
  await act(async () => track().props.onScrollBeginDrag());
  await act(async () =>
    track().props.onScroll({ nativeEvent: { contentOffset: { x: 1100 } } }),
  );
  expect(heading()).toBe(
    calendarMonthLabel({ year: 2027, month: 1 }, mockLocales.en),
  );
  expect(props.onBrowseMonth).not.toHaveBeenCalled();
  await endDrag(1400);
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 1400 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2027, month: 1 });
  props = { ...props, draftMonth: { year: 2027, month: 1 } };
  await act(async () => app.update(<CalendarModal {...props} />));
  expect(heading()).toBe(
    calendarMonthLabel({ year: 2027, month: 1 }, mockLocales.en),
  );
});

test('heading swipe pages the same grid, while short and vertical touches keep the month', async () => {
  mockReduced = false;
  await mount();
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
      .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
  );
  const heading = () =>
    app.root.findAllByProps({ testID: 'calendar-month-swipe-heading' })[0];
  const touch = async (x: number, y: number, endX: number, endY: number) => {
    await act(async () => {
      heading().props.onTouchStart({
        nativeEvent: { pageX: x, pageY: y, touches: [{}] },
      });
      heading().props.onTouchEnd({
        nativeEvent: { pageX: endX, pageY: endY },
      });
    });
  };
  await touch(300, 100, 290, 100);
  await touch(300, 100, 100, 270);
  expect(props.onBrowseMonth).not.toHaveBeenCalled();
  await touch(300, 100, 100, 100);
  const track = app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
  expect(
    app.root.findAllByProps({ testID: 'calendar-visible-heading' })[0].props
      .children,
  ).toBe(calendarMonthLabel({ year: 2026, month: 10 }, mockLocales.en));
  await act(async () =>
    track.props.onScroll({ nativeEvent: { contentOffset: { x: 1100 } } }),
  );
  expect(
    app.root.findAllByProps({ testID: 'calendar-visible-heading' })[0].props
      .children,
  ).toBe(calendarMonthLabel({ year: 2026, month: 11 }, mockLocales.en));
  expect(props.onBrowseMonth).not.toHaveBeenCalled();
  expect(button('Next month').props.disabled).toBe(true);
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-page-track' })[0]
      .props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: 1400 } },
      }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2026, month: 11 });
});

test.each([false, true])(
  'grid touch fallback runs only with Reduce Motion %s; native cancellation never forces a month',
  async reduced => {
    mockReduced = reduced;
    await mount();
    const surface = app.root.findAllByProps({
      testID: 'calendar-swipe-surface',
    })[0];
    await act(async () =>
      surface.props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
    );
    const track = () =>
      app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
    if (!reduced) await act(async () => track().props.onScrollBeginDrag());
    await act(async () => {
      surface.props.onTouchStartCapture({
        nativeEvent: { pageX: 300, pageY: 100, touches: [{}] },
      });
      surface.props.onTouchEndCapture({
        nativeEvent: { pageX: 250, pageY: 100 },
      });
    });
    expect(track().props.scrollEnabled).toBe(!reduced);
    await act(async () =>
      track().props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: 700 } },
      }),
    );
    expect(props.onBrowseMonth).toHaveBeenCalledTimes(reduced ? 1 : 0);
    if (reduced)
      expect(props.onBrowseMonth).toHaveBeenCalledWith({
        year: 2026,
        month: 11,
      });
  },
);

test('a reversed native fling follows its actual resting page rather than its initial velocity', async () => {
  mockReduced = false;
  await mount();
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
      .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
  );
  const track = () =>
    app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
  await act(async () => track().props.onScrollBeginDrag());
  await act(async () =>
    track().props.onScrollEndDrag({
      nativeEvent: { contentOffset: { x: 750 }, velocity: { x: 1 } },
    }),
  );
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 700 } },
    }),
  );
  expect(props.onBrowseMonth).not.toHaveBeenCalled();
  expect(button('Next month').props.disabled).toBe(false);
});

test('arrival at a native page boundary commits without waiting for delayed momentum-end', async () => {
  mockReduced = false;
  await mount();
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
      .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
  );
  const track = () =>
    app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
  await act(async () => track().props.onScrollBeginDrag());
  await act(async () =>
    track().props.onScrollEndDrag({
      nativeEvent: { contentOffset: { x: 900 } },
    }),
  );
  await act(async () =>
    track().props.onScroll({
      nativeEvent: { contentOffset: { x: 1400 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2026, month: 11 });
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 1400 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
});

test('late momentum callbacks from an early commit cannot finish a new active drag', async () => {
  mockReduced = false;
  await mount();
  await act(async () =>
    app.root
      .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
      .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
  );
  const track = () =>
    app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
  await act(async () => track().props.onScrollBeginDrag());
  await endDrag(1400);
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  props = { ...props, draftMonth: { year: 2026, month: 11 } };
  await act(async () => app.update(<CalendarModal {...props} />));
  await act(async () => track().props.onScrollBeginDrag());
  await act(async () => {
    track().props.onMomentumScrollBegin();
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 1400 } },
    });
  });
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  expect(button('Next month').props.disabled).toBe(true);
  await endDrag(700);
  await act(async () =>
    track().props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 700 } },
    }),
  );
  expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
  expect(button('Next month').props.disabled).toBe(false);
});

test('missing momentum-end waits for native scroll inactivity and never commits midway through a snap', async () => {
  jest.useFakeTimers();
  try {
    mockReduced = false;
    await mount();
    await act(async () =>
      app.root
        .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
        .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
    );
    const track = () =>
      app.root.findAllByProps({ testID: 'calendar-page-track' })[0];
    await act(async () => track().props.onScrollBeginDrag());
    await act(async () =>
      track().props.onScrollEndDrag({
        nativeEvent: { contentOffset: { x: 950 } },
      }),
    );
    for (const x of [1000, 1100, 1200, 1390]) {
      await act(async () => jest.advanceTimersByTime(300));
      expect(props.onBrowseMonth).not.toHaveBeenCalled();
      await act(async () =>
        track().props.onScroll({
          nativeEvent: { contentOffset: { x } },
        }),
      );
    }
    await act(async () => jest.advanceTimersByTime(350));
    expect(props.onBrowseMonth).toHaveBeenCalledTimes(1);
    expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2026, month: 11 });
    const day = currentPage()
      .findAllByType(CalendarDay)
      .find(node => node.props.date?.dateString === '2026-10-10')!
      .findAll(node => typeof node.props.onPress === 'function')[0];
    await act(async () => day.props.onPress());
    expect(props.onApplyDay).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

test.each(['en', 'es', 'uk'] as Language[])(
  'compact title keeps a 16dp inset without narrowing the day grid in %s',
  async language => {
    const dimensions = jest
      .spyOn(
        jest.requireActual<typeof import('react-native')>('react-native'),
        'useWindowDimensions',
      )
      .mockReturnValue({ width: 384, height: 800, scale: 1, fontScale: 1.1 });
    try {
      mockLanguage = language;
      await mount();
      const title = app.root.findAllByProps({
        testID: 'calendar-title-row',
      })[0];
      const content = app.root
        .findAllByType(ScrollView)
        .find(
          node => !node.props.horizontal && node.props.contentContainerStyle,
        )!;
      const contentInset = StyleSheet.flatten(
        content.props.contentContainerStyle,
      ).paddingHorizontal;
      expect(contentInset).toBe(4);
      expect(
        StyleSheet.flatten(title.props.style).paddingHorizontal + contentInset,
      ).toBe(16);
    } finally {
      dimensions.mockRestore();
    }
  },
);

test('warms three pages before dragging and promotes the prepared Calendar without remounting', async () => {
  const formatters = jest.spyOn(Intl, 'DateTimeFormat');
  try {
    await mount();
    await act(async () =>
      app.root
        .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
        .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
    );
    expect(app.root.findAllByType(Calendar)).toHaveLength(3);
    const prepared = app.root
      .findAllByProps({ testID: 'calendar-next-preview' })[0]
      .findByType(Calendar);
    const original = currentPage().findByType(Calendar);
    formatters.mockClear();
    await act(async () => {
      app.root
        .findAllByProps({ testID: 'calendar-page-track' })[0]
        .props.onScrollBeginDrag();
    });
    expect(currentPage().findByType(Calendar)).toBe(original);
    expect(
      app.root
        .findAllByProps({ testID: 'calendar-next-preview' })[0]
        .findByType(Calendar),
    ).toBe(prepared);
    expect(
      formatters.mock.calls.filter(
        ([, options]) =>
          options?.dateStyle === 'full' || options?.weekday === 'short',
      ),
    ).toHaveLength(0);
    await endDrag(1400);
    await act(async () => {
      app.root
        .findAllByProps({ testID: 'calendar-page-track' })[0]
        .props.onMomentumScrollEnd({
          nativeEvent: { contentOffset: { x: 1400 } },
        });
    });
    props = { ...props, draftMonth: { year: 2026, month: 11 } };
    await act(async () => app.update(<CalendarModal {...props} />));
    expect(currentPage().findByType(Calendar)).toBe(prepared);
    expect(app.root.findAllByType(Calendar)).toHaveLength(3);
    expect(
      formatters.mock.calls.filter(
        ([, options]) => options?.dateStyle === 'full',
      ),
    ).toHaveLength(1);
    expect(
      formatters.mock.calls.filter(
        ([, options]) => options?.weekday === 'short',
      ),
    ).toHaveLength(1);
  } finally {
    formatters.mockRestore();
  }
});

test.each([-1, 1] as const)(
  'native anchoring promotes the same visible page without a second scroll command (%s)',
  async direction => {
    mockReduced = false;
    await mount();
    await act(async () =>
      app.root
        .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
        .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
    );
    const track = () =>
      app.root
        .findAllByType(ScrollView)
        .find(node => node.props.testID === 'calendar-page-track')!;
    const scrollTo = jest.spyOn(track().instance, 'scrollTo');
    scrollTo.mockClear();
    const previewId =
      direction === 1 ? 'calendar-next-preview' : 'calendar-previous-preview';
    const prepared = app.root.findAllByProps({ testID: previewId })[0];
    const calendar = prepared.findByType(Calendar);
    await act(async () => track().props.onScrollBeginDrag());
    expect(track().props.maintainVisibleContentPosition).toEqual({
      minIndexForVisible: 0,
    });
    await endDrag(direction === 1 ? 1400 : 0);
    props = {
      ...props,
      draftMonth: { year: 2026, month: direction === 1 ? 11 : 9 },
    };
    await act(async () => app.update(<CalendarModal {...props} />));
    expect(currentPage()).toBe(prepared);
    expect(currentPage().findByType(Calendar)).toBe(calendar);
    expect(currentPage().props.collapsable).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
    // An explicit jump must select the requested month instead of anchoring the old one.
    props = { ...props, draftMonth: { year: 2028, month: 3 } };
    await act(async () => app.update(<CalendarModal {...props} />));
    expect(scrollTo).toHaveBeenCalledWith({ x: 700, animated: false });
    expect(track().props.maintainVisibleContentPosition).toBeUndefined();
    expect(currentPage().findByType(Calendar).props.current).toBe('2028-03-01');
  },
);

test('Reduce Motion uses explicit positioning without native anchoring', async () => {
  mockReduced = true;
  await mount();
  const surface = () =>
    app.root.findAllByProps({ testID: 'calendar-swipe-surface' })[0];
  await act(async () =>
    surface().props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
  );
  const track = () =>
    app.root
      .findAllByType(ScrollView)
      .find(node => node.props.testID === 'calendar-page-track')!;
  const scrollTo = jest.spyOn(track().instance, 'scrollTo');
  scrollTo.mockClear();
  await act(async () => {
    surface().props.onTouchStartCapture({
      nativeEvent: { pageX: 300, pageY: 100, touches: [{}] },
    });
    surface().props.onTouchEndCapture({
      nativeEvent: { pageX: 100, pageY: 100 },
    });
  });
  props = { ...props, draftMonth: { year: 2026, month: 11 } };
  await act(async () => app.update(<CalendarModal {...props} />));
  expect(track().props.maintainVisibleContentPosition).toBeUndefined();
  expect(scrollTo).toHaveBeenCalledWith({ x: 1400, animated: false });
  expect(scrollTo).toHaveBeenCalledWith({ x: 700, animated: false });
});

test.each([-1, 1] as const)(
  'Android retains the visible page inside the native frame host without a later scroll command (%s)',
  async direction => {
    const platform = jest.replaceProperty(Platform, 'OS', 'android');
    try {
      mockReduced = false;
      await mount();
      await act(async () =>
        app.root
          .findAllByProps({ testID: 'calendar-swipe-surface' })[0]
          .props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
      );
      const track = () =>
        app.root
          .findAllByType(ScrollView)
          .find(node => node.props.testID === 'calendar-page-track')!;
      const scrollTo = jest.spyOn(track().instance, 'scrollTo');
      scrollTo.mockClear();
      const preview = app.root.findAllByProps({
        testID:
          direction === 1
            ? 'calendar-next-preview'
            : 'calendar-previous-preview',
      })[0];
      await act(async () => track().props.onScrollBeginDrag());
      await endDrag(direction === 1 ? 1400 : 0);
      expect(props.onBrowseMonth).toHaveBeenCalledWith({
        year: 2026,
        month: direction === 1 ? 11 : 9,
      });
      props = {
        ...props,
        draftMonth: { year: 2026, month: direction === 1 ? 11 : 9 },
      };
      await act(async () => app.update(<CalendarModal {...props} />));
      expect(currentPage()).toBe(preview);
      const nativeHosts = app.root.findAll(
        node =>
          node.props.testID === 'calendar-swipe-surface' &&
          typeof node.type === 'string',
      );
      expect(nativeHosts).toHaveLength(1);
      expect(nativeHosts[0].type).toBe('CashDriverCalendarPageHost');
      expect(track().props.maintainVisibleContentPosition).toBeUndefined();
      expect(scrollTo).not.toHaveBeenCalled();
      // External jumps use the same frame-level ownership, not a competing scrollTo.
      props = { ...props, draftMonth: { year: 2028, month: 3 } };
      await act(async () => app.update(<CalendarModal {...props} />));
      expect(currentPage().findByType(Calendar).props.current).toBe(
        '2028-03-01',
      );
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      platform.restore();
    }
  },
);

test('Android Reduce Motion changes the centered month without an intermediate outer-page command', async () => {
  const platform = jest.replaceProperty(Platform, 'OS', 'android');
  try {
    mockReduced = true;
    await mount();
    const surface = () =>
      app.root.findAllByProps({ testID: 'calendar-swipe-surface' })[0];
    await act(async () =>
      surface().props.onLayout({ nativeEvent: { layout: { width: 700 } } }),
    );
    const track = () =>
      app.root
        .findAllByType(ScrollView)
        .find(node => node.props.testID === 'calendar-page-track')!;
    const scrollTo = jest.spyOn(track().instance, 'scrollTo');
    scrollTo.mockClear();
    await act(async () => {
      surface().props.onTouchStartCapture({
        nativeEvent: { pageX: 300, pageY: 100, touches: [{}] },
      });
      surface().props.onTouchEndCapture({
        nativeEvent: { pageX: 100, pageY: 100 },
      });
    });
    expect(props.onBrowseMonth).toHaveBeenCalledWith({ year: 2026, month: 11 });
    props = { ...props, draftMonth: { year: 2026, month: 11 } };
    await act(async () => app.update(<CalendarModal {...props} />));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(currentPage().findByType(Calendar).props.current).toBe('2026-11-01');
  } finally {
    platform.restore();
  }
});

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
    const calendar = currentPage().findByType(Calendar);
    expect(calendar.props.showSixWeeks).toBe(false);
    expect(calendar.props.hideExtraDays).toBe(false);
    const cells = currentPage().findAllByType(CalendarDay);
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
