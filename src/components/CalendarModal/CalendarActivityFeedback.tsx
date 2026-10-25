import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { calendarFeedback } from '../../constants/theme/calendar';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './CalendarModal.styles';
import {
  CalendarActivityFeedbackProps,
  CalendarMonthActivityProps,
} from './CalendarActivityFeedback.interface';

export function CalendarActivityFeedback({
  status,
  paging = false,
  requestKey,
  message,
  motion,
}: CalendarActivityFeedbackProps) {
  const { colors } = useAppTheme();
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const position = useRef(new Animated.Value(0)).current;
  const pagingFeedback = useRef(false);
  const visible = paging || (status === 'loading' && visibleKey === requestKey);
  useEffect(() => {
    if (paging) pagingFeedback.current = true;
    if (status !== 'loading') {
      if (!paging) pagingFeedback.current = false;
      setVisibleKey(null);
      return;
    }
    // Continue the existing indicator without a second delay after a swipe.
    if (pagingFeedback.current) {
      setVisibleKey(requestKey);
      return;
    }
    if (visibleKey === requestKey) return;
    const timer = setTimeout(
      () => setVisibleKey(requestKey),
      calendarFeedback.indicatorDelay,
    );
    return () => clearTimeout(timer);
  }, [requestKey, status, paging, visibleKey]);
  useEffect(() => {
    if ((visible || status === 'error') && motion.active)
      AccessibilityInfo.announceForAccessibility(message);
  }, [visible, status, message, motion.active]);
  useEffect(() => {
    position.setValue(0);
    if (!visible || motion.reduced || !motion.active) return;
    const animation = Animated.loop(
      Animated.timing(position, {
        toValue: 1,
        duration: calendarFeedback.progressDuration,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [visible, motion.reduced, motion.active, position, requestKey]);
  return (
    <View
      testID="calendar-progress-track"
      accessible={false}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={styles.progressTrack}
    >
      <Animated.View
        testID="calendar-progress-segment"
        style={[
          styles.progressSegment,
          {
            backgroundColor: colors.primary,
            width: width * calendarFeedback.progressSegmentFraction,
            transform: [
              {
                translateX: motion.reduced
                  ? (width * (1 - calendarFeedback.progressSegmentFraction)) / 2
                  : position.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        -width * calendarFeedback.progressSegmentFraction,
                        width,
                      ],
                    }),
              },
            ],
          },
          visible ? styles.visibleFeedback : styles.hiddenFeedback,
        ]}
      />
    </View>
  );
}

export function CalendarMonthActivity({
  occupied,
  motion,
}: CalendarMonthActivityProps) {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(occupied ? 1 : 0)).current;
  const previous = useRef(occupied);
  useEffect(() => {
    const changed = previous.current !== occupied;
    previous.current = occupied;
    if (!changed || !occupied || motion.reduced || !motion.active) {
      opacity.setValue(occupied ? 1 : 0);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: calendarFeedback.highlightDuration,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [occupied, motion.reduced, motion.active, opacity]);
  return (
    <Animated.View
      testID="calendar-month-activity"
      pointerEvents="none"
      accessible={false}
      style={[
        styles.monthActivity,
        { backgroundColor: colors.softGreen, opacity },
      ]}
    />
  );
}
