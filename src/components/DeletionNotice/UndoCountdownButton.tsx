import { deletionTiming } from '../../constants/timing';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { DELETION_UNDO_SECONDS } from '../../features/transactions/deletionConstants';
import { AppText } from '../../ui/AppText/AppText';
import { styles } from './UndoCountdownButton.styles';

export function UndoCountdownButton({
  label,
  expiresAt,
  onPress,
}: {
  label: string;
  expiresAt: number;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        preferenceChanged = true;
        if (mounted) setReduceMotion(enabled);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted && !preferenceChanged) setReduceMotion(enabled);
      })
      .catch(() => {
        if (mounted && !preferenceChanged) setReduceMotion(true);
      });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    const duration = Math.max(0, expiresAt - Date.now());
    const remaining = () =>
      Math.max(0, expiresAt - Date.now()) / (DELETION_UNDO_SECONDS * 1000);
    progress.setValue(remaining());
    if (reduceMotion) {
      const timer = setInterval(
        () => progress.setValue(remaining()),
        deletionTiming.countdownRefreshIntervalMs,
      );
      return () => clearInterval(timer);
    }
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [expiresAt, progress, reduceMotion]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: false }}
      disabled={false}
      onPress={onPress}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <Animated.View
        testID="undo-countdown-fill"
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.fill,
          {
            backgroundColor: colors.onPrimary,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      />
      <AppText style={[styles.label, { color: colors.onPrimary }]}>
        {label}
      </AppText>
    </Pressable>
  );
}
