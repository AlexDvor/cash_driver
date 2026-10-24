import React, {
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Platform,
  ScrollView,
  ScrollViewInstance,
  useWindowDimensions,
  View,
} from 'react-native';
import { sizing, spacing, typography } from '../../constants/theme/tokens';
import {
  calendarGestures,
  resolveHeadingSwipe,
} from '../../constants/calendarGestures';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../../ui/AppText/AppText';
import { offsetCalendarMonth } from '../CalendarModal/calendarPresentation';
import { styles } from '../CalendarModal/CalendarModal.styles';
import {
  CalendarGridHandle,
  CalendarPagerProps,
} from './CalendarGrid.interface';
import { CalendarMonthPage } from './CalendarMonthPage';
import { CalendarPageHost } from './CalendarPageHost';

const noDates: readonly string[] = [];
const visiblePageAnchor = { minIndexForVisible: 0 };

export const CalendarGrid = forwardRef<CalendarGridHandle, CalendarPagerProps>(
  function CalendarGridContent(
    {
      viewportWidth,
      onViewportWidth,
      onPagingChange,
      onPreviewMonth,
      active,
      reducedMotion,
      resetKey,
      ...props
    },
    ref,
  ) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const { fontScale } = useWindowDimensions();
    const pageScroll = useRef<ScrollViewInstance>(null);
    const scrolling = useRef(false);
    const pendingMonth = useRef<string | null>(null);
    const dragging = useRef(false);
    const previewDirection = useRef<-1 | 0 | 1>(0);
    const touchStart = useRef<{
      x: number;
      y: number;
      at: number;
      multi: boolean;
    } | null>(null);
    const lastOffset = useRef(viewportWidth);
    const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latest = useRef(props);
    latest.current = props;
    const showPreview = useCallback(
      (direction: -1 | 0 | 1) => {
        if (previewDirection.current === direction) return;
        previewDirection.current = direction;
        const month = latest.current.draftMonth;
        onPreviewMonth(
          month && direction ? offsetCalendarMonth(month, direction) : null,
        );
      },
      [onPreviewMonth],
    );
    useEffect(
      () => () => {
        if (settleTimer.current) clearTimeout(settleTimer.current);
      },
      [],
    );
    const applyDay = useCallback<CalendarPagerProps['onApplyDay']>(date => {
      const current = latest.current;
      if (
        !scrolling.current &&
        !pendingMonth.current &&
        date.year === current.draftMonth?.year &&
        date.month === current.draftMonth.month
      )
        current.onApplyDay(date);
    }, []);
    const calendarWidth = Math.max(
      Math.max(
        sizing.touchTarget,
        Math.ceil(typography.body * fontScale * 1.5 + spacing.md),
      ) * 7,
      viewportWidth,
    );
    const overflow = calendarWidth > viewportWidth;
    const year = props.draftMonth?.year;
    const month = props.draftMonth?.month;
    const months = useMemo(
      () =>
        year != null && month != null
          ? [-1, 0, 1].map(offset =>
              offsetCalendarMonth({ year, month }, offset),
            )
          : [],
      [year, month],
    );
    const monthKey = `${year}/${month}`;
    const previousMonthKey = useRef(monthKey);
    const externalMonthChange =
      previousMonthKey.current !== monthKey &&
      pendingMonth.current !== monthKey;
    useLayoutEffect(() => {
      if (!viewportWidth) return;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      // Android positions the chosen native page before drawing its descendants.
      // A same-month lifecycle reset still cancels any unfinished gesture.
      const nativeMonthChange =
        Platform.OS === 'android' && previousMonthKey.current !== monthKey;
      if (
        !nativeMonthChange &&
        (pendingMonth.current !== monthKey || reducedMotion)
      )
        pageScroll.current?.scrollTo({ x: viewportWidth, animated: false });
      previousMonthKey.current = monthKey;
      pendingMonth.current = null;
      scrolling.current = false;
      onPagingChange(false);
      dragging.current = false;
      previewDirection.current = 0;
      onPreviewMonth(null);
      touchStart.current = null;
      lastOffset.current = viewportWidth;
    }, [
      monthKey,
      viewportWidth,
      resetKey,
      active,
      reducedMotion,
      onPagingChange,
      onPreviewMonth,
    ]);
    const finishPage = useCallback(
      (offset: number) => {
        if (!viewportWidth || !scrolling.current || pendingMonth.current)
          return;
        const page = Math.max(
          0,
          Math.min(2, Math.round(offset / viewportWidth)),
        );
        if (settleTimer.current) clearTimeout(settleTimer.current);
        scrolling.current = false;
        if (page === 1) {
          showPreview(0);
          onPagingChange(false);
          return;
        }
        const current = latest.current;
        if (!current.draftMonth) return;
        const next = offsetCalendarMonth(current.draftMonth, page > 1 ? 1 : -1);
        pendingMonth.current = `${next.year}/${next.month}`;
        current.onBrowseMonth(next);
      },
      [viewportWidth, onPagingChange, showPreview],
    );
    // Restart after every native offset: elapsed time alone does not prove a
    // page reached its destination. Some Android slow snaps omit momentum-end.
    const settleWhenIdle = useCallback(() => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        if (dragging.current || !scrolling.current || pendingMonth.current)
          return;
        const offset = lastOffset.current;
        const target =
          Math.max(0, Math.min(2, Math.round(offset / viewportWidth))) *
          viewportWidth;
        pageScroll.current?.scrollTo({ x: target, animated: false });
        finishPage(target);
      }, calendarGestures.slowSnapFallbackMs);
    }, [viewportWidth, finishPage]);
    const forcePage = useCallback(
      (direction: -1 | 1) => {
        if (!viewportWidth || pendingMonth.current || !active) return;
        scrolling.current = true;
        dragging.current = false;
        onPagingChange(true);
        const target = viewportWidth * (1 + direction);
        if (!reducedMotion || Platform.OS !== 'android')
          pageScroll.current?.scrollTo({ x: target, animated: !reducedMotion });
        if (reducedMotion) {
          lastOffset.current = target;
          finishPage(target);
        } else settleWhenIdle();
      },
      [
        viewportWidth,
        active,
        reducedMotion,
        onPagingChange,
        finishPage,
        settleWhenIdle,
      ],
    );
    useImperativeHandle(
      ref,
      () => ({
        page: direction => {
          if (!scrolling.current) forcePage(direction);
        },
      }),
      [forcePage],
    );

    return (
      <>
        <CalendarPageHost
          testID="calendar-swipe-surface"
          onLayout={event => onViewportWidth(event.nativeEvent.layout.width)}
          onTouchStartCapture={event => {
            if (!reducedMotion) return;
            touchStart.current = {
              x: event.nativeEvent.pageX,
              y: event.nativeEvent.pageY,
              at: Date.now(),
              multi: event.nativeEvent.touches.length > 1,
            };
          }}
          onTouchMoveCapture={event => {
            if (touchStart.current && event.nativeEvent.touches.length > 1)
              touchStart.current.multi = true;
          }}
          onTouchEndCapture={event => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start || start.multi || !active || overflow || !reducedMotion)
              return;
            const dx = event.nativeEvent.pageX - start.x;
            const dy = event.nativeEvent.pageY - start.y;
            const duration = Math.max(1, Date.now() - start.at);
            const direction = resolveHeadingSwipe(
              dx,
              dy,
              duration,
              viewportWidth,
              start.multi,
            );
            if (direction) forcePage(direction);
          }}
          onTouchCancelCapture={() => {
            touchStart.current = null;
          }}
          style={styles.pageViewport}
        >
          <ScrollView
            key={viewportWidth}
            ref={pageScroll}
            testID="calendar-page-track"
            horizontal
            pagingEnabled
            maintainVisibleContentPosition={
              Platform.OS === 'android' || externalMonthChange || reducedMotion
                ? undefined
                : visiblePageAnchor
            }
            decelerationRate="fast"
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            scrollEnabled={
              !overflow && !reducedMotion && active && !pendingMonth.current
            }
            contentOffset={{ x: viewportWidth, y: 0 }}
            onScrollBeginDrag={() => {
              scrolling.current = true;
              dragging.current = true;
              onPagingChange(true);
              if (settleTimer.current) clearTimeout(settleTimer.current);
            }}
            scrollEventThrottle={calendarGestures.scrollThrottleMs}
            onScroll={event => {
              lastOffset.current = event.nativeEvent.contentOffset.x;
              if (
                viewportWidth > 0 &&
                scrolling.current &&
                !pendingMonth.current
              ) {
                const page = Math.round(lastOffset.current / viewportWidth) - 1;
                showPreview(page < 0 ? -1 : page > 0 ? 1 : 0);
                if (!dragging.current) {
                  // At an outer page the native animation has reached its hard
                  // boundary. Promote now, without Android's delayed momentum-end.
                  if (
                    lastOffset.current <= 0 ||
                    lastOffset.current >= viewportWidth * 2
                  )
                    finishPage(lastOffset.current);
                  else settleWhenIdle();
                }
              }
            }}
            onMomentumScrollBegin={() => {
              if (dragging.current) return;
              settleWhenIdle();
            }}
            onMomentumScrollEnd={event => {
              if (dragging.current) return;
              lastOffset.current = event.nativeEvent.contentOffset.x;
              finishPage(lastOffset.current);
            }}
            onScrollEndDrag={event => {
              dragging.current = false;
              lastOffset.current = event.nativeEvent.contentOffset.x;
              if (
                lastOffset.current <= 0 ||
                lastOffset.current >= viewportWidth * 2
              )
                finishPage(lastOffset.current);
              else settleWhenIdle();
            }}
          >
            {months.map((coordinate, index) => {
              const offset = index - 1;
              const preview = offset !== 0;
              const page = (
                <CalendarMonthPage
                  calendarWidth={calendarWidth}
                  props={{
                    ...props,
                    draftMonth: coordinate,
                    occupiedDates: preview ? noDates : props.occupiedDates,
                    activityHasData: preview ? false : props.activityHasData,
                    activityStatus: preview ? 'loading' : props.activityStatus,
                    onApplyDay: applyDay,
                  }}
                />
              );
              return (
                <View
                  key={`${coordinate.year}/${coordinate.month}`}
                  collapsable={false}
                  testID={
                    preview
                      ? offset < 0
                        ? 'calendar-previous-preview'
                        : 'calendar-next-preview'
                      : 'calendar-current-page'
                  }
                  pointerEvents={preview ? 'none' : 'auto'}
                  accessibilityElementsHidden={preview}
                  importantForAccessibility={
                    preview ? 'no-hide-descendants' : 'auto'
                  }
                  style={{ width: viewportWidth }}
                >
                  {overflow ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={!preview}
                      scrollEnabled={!preview}
                      style={{ width: viewportWidth }}
                    >
                      {page}
                    </ScrollView>
                  ) : (
                    page
                  )}
                </View>
              );
            })}
          </ScrollView>
        </CalendarPageHost>
        <View style={styles.legend}>
          <View
            accessible={false}
            style={[styles.legendDot, { backgroundColor: colors.primary }]}
          />
          <AppText secondary style={styles.legendLabel}>
            {t('calendarActivityLegend')}
          </AppText>
        </View>
      </>
    );
  },
);
