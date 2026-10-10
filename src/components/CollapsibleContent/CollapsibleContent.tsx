import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import type { CollapsibleContentProps } from './CollapsibleContent.interface';
import { styles } from './CollapsibleContent.styles';

export function CollapsibleContent({
  expanded,
  resetCount,
  children,
  testID,
}: CollapsibleContentProps) {
  const [contentHeight, setContentHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const previous = useRef({ resetCount, reduceMotion, contentHeight });

  useEffect(() => {
    let active = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        preferenceChanged = true;
        if (active) {
          setReduceMotion(enabled);
        }
      },
    );

    async function readPreference() {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (active && !preferenceChanged) {
          setReduceMotion(enabled);
        }
      } catch {
        if (active && !preferenceChanged) {
          setReduceMotion(true);
        }
      }
    }
    readPreference();

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useLayoutEffect(() => {
    const targetHeight = expanded ? contentHeight : 0;
    const targetOpacity = expanded ? 1 : 0;
    const instant =
      reduceMotion !== false ||
      previous.current.reduceMotion !== reduceMotion ||
      previous.current.resetCount !== resetCount ||
      previous.current.contentHeight === 0;
    previous.current = { resetCount, reduceMotion, contentHeight };
    height.stopAnimation();
    opacity.stopAnimation();

    if (instant) {
      height.setValue(targetHeight);
      opacity.setValue(targetOpacity);
      return;
    }

    const animation = Animated.parallel([
      Animated.timing(height, {
        toValue: targetHeight,
        duration: 180,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: targetOpacity,
        duration: 180,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [contentHeight, expanded, height, opacity, reduceMotion, resetCount]);

  return (
    <Animated.View
      testID={testID}
      style={[styles.clipping, { height, opacity }]}
      pointerEvents={expanded ? 'auto' : 'none'}
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
    >
      <View
        style={styles.content}
        onLayout={event => setContentHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </View>
    </Animated.View>
  );
}
