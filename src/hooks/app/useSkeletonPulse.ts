import { motion } from '../../constants/theme/motion';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing } from 'react-native';

export function useSkeletonPulse(loading: boolean) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const preference = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        preferenceChanged = true;
        setReduceMotion(enabled);
      },
    );
    const appState = AppState.addEventListener('change', state => {
      setActive(state === 'active');
    });
    AccessibilityInfo.isReduceMotionEnabled().then(
      enabled => {
        if (mounted && !preferenceChanged) setReduceMotion(enabled);
      },
      () => {}, // Keep the static fallback when the native preference is unavailable.
    );
    return () => {
      mounted = false;
      preference.remove();
      appState.remove();
    };
  }, []);

  useEffect(() => {
    opacity.setValue(1);
    if (!loading || reduceMotion || !active) return;
    const animation = Animated.loop(
      Animated.sequence(
        [motion.skeletonMinimumOpacity, 1].map(toValue =>
          Animated.timing(opacity, {
            toValue,
            duration: motion.skeletonHalfCycleDurationMs,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
            isInteraction: false,
          }),
        ),
      ),
    );
    animation.start();
    return () => {
      animation.stop();
      opacity.setValue(1);
    };
  }, [active, loading, opacity, reduceMotion]);
  return opacity;
}
