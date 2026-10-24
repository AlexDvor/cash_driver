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

const noDates: readonly string[] = [];

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
    const momentum = useRef(false);
    const dragStarted = useRef(0);
    const flingTarget = useRef<number | null>(null);
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
    useLayoutEffect(() => {
      if (!viewportWidth) return;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      pageScroll.current?.scrollTo({ x: viewportWidth, animated: false });
      pendingMonth.current = null;
      scrolling.current = false;
      onPagingChange(false);
      momentum.current = false;
      flingTarget.current = null;
      previewDirection.current = 0;
      onPreviewMonth(null);
      touchStart.current = null;
      lastOffset.current = viewportWidth;
    }, [
      monthKey,
      viewportWidth,
      resetKey,
      active,
      onPagingChange,
      onPreviewMonth,
    ]);
    const finishPage = useCallback(
      (offset: number) => {
        if (!viewportWidth || !scrolling.current || pendingMonth.current)
          return;
        const page = Math.round(offset / viewportWidth);
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
    const forcePage = useCallback(
      (direction: -1 | 1) => {
        if (!viewportWidth || pendingMonth.current || !active) return;
        scrolling.current = true;
        onPagingChange(true);
        const target = viewportWidth * (1 + direction);
        flingTarget.current = target;
        showPreview(direction);
        pageScroll.current?.scrollTo({ x: target, animated: !reducedMotion });
        if (settleTimer.current) clearTimeout(settleTimer.current);
        if (reducedMotion) finishPage(target);
        else
          settleTimer.current = setTimeout(
            () => finishPage(target),
            calendarGestures.programmaticSettleMs,
          );
      },
      [
        viewportWidth,
        active,
        reducedMotion,
        onPagingChange,
        finishPage,
        showPreview,
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
        <View
          testID="calendar-swipe-surface"
          onLayout={event => onViewportWidth(event.nativeEvent.layout.width)}
          onTouchStartCapture={event => {
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
            if (!start || start.multi || !active || overflow) return;
            const dx = event.nativeEvent.pageX - start.x;
            const dy = event.nativeEvent.pageY - start.y;
            const distance = Math.abs(dx);
            const duration = Math.max(1, Date.now() - start.at);
            const direction = resolveHeadingSwipe(
              dx,
              dy,
              duration,
              viewportWidth,
              start.multi,
            );
            if (
              direction &&
              (reducedMotion ||
                (distance < viewportWidth * calendarGestures.pageFraction &&
                  distance >= calendarGestures.flingDistance &&
                  distance / duration >= calendarGestures.flingVelocity))
            )
              forcePage(direction);
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
            snapToInterval={viewportWidth}
            disableIntervalMomentum
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
              dragStarted.current = Date.now();
              flingTarget.current = null;
              onPagingChange(true);
              momentum.current = false;
              if (settleTimer.current) clearTimeout(settleTimer.current);
            }}
            scrollEventThrottle={calendarGestures.scrollThrottleMs}
            onScroll={event => {
              lastOffset.current = event.nativeEvent.contentOffset.x;
              if (
                viewportWidth > 0 &&
                scrolling.current &&
                !pendingMonth.current &&
                flingTarget.current === null
              ) {
                const page = Math.round(lastOffset.current / viewportWidth) - 1;
                showPreview(page < 0 ? -1 : page > 0 ? 1 : 0);
              }
            }}
            onMomentumScrollBegin={() => {
              momentum.current = true;
              if (settleTimer.current) clearTimeout(settleTimer.current);
            }}
            onMomentumScrollEnd={event => {
              momentum.current = false;
              finishPage(
                flingTarget.current ?? event.nativeEvent.contentOffset.x,
              );
            }}
            onScrollEndDrag={event => {
              if (flingTarget.current != null) return;
              const offset = event.nativeEvent.contentOffset.x;
              const distance = offset - viewportWidth;
              const elapsed = Math.max(1, Date.now() - dragStarted.current);
              if (
                Math.abs(distance) >= calendarGestures.flingDistance &&
                Math.abs(distance) / elapsed >= calendarGestures.flingVelocity
              ) {
                flingTarget.current = viewportWidth * (distance > 0 ? 2 : 0);
                pageScroll.current?.scrollTo({
                  x: flingTarget.current,
                  animated: !reducedMotion,
                });
                if (reducedMotion) finishPage(flingTarget.current);
                else
                  settleTimer.current = setTimeout(
                    () => finishPage(flingTarget.current ?? offset),
                    calendarGestures.programmaticSettleMs,
                  );
                return;
              }
              // Some Android releases omit momentum callbacks for a slow snap.
              settleTimer.current = setTimeout(() => {
                if (!momentum.current) finishPage(lastOffset.current);
              }, calendarGestures.slowSnapFallbackMs);
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
        </View>
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
