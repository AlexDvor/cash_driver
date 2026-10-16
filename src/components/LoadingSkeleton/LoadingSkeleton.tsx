import React, { useRef, useState } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';
import { styles } from './LoadingSkeleton.styles';
import { useSkeletonPulse } from '../../hooks/app/useSkeletonPulse';

export function LoadingSkeleton({
  label,
  children,
  loading = true,
  style,
  preserveHeight = false,
}: React.PropsWithChildren<{
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  preserveHeight?: boolean;
}>) {
  const opacity = useSkeletonPulse(loading);
  const [readyHeight, setReadyHeight] = useState(0);
  const currentLoading = useRef(loading);
  currentLoading.current = loading;
  return (
    <View
      style={[
        styles.container,
        style,
        preserveHeight && loading && { minHeight: readyHeight },
      ]}
      onLayout={event => {
        if (!currentLoading.current && preserveHeight) {
          setReadyHeight(event.nativeEvent.layout.height);
        }
      }}
      accessible={loading}
      accessibilityRole={loading ? 'progressbar' : undefined}
      accessibilityLabel={loading ? label : undefined}
      accessibilityState={loading ? { busy: true } : undefined}
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        pointerEvents={loading ? 'none' : 'auto'}
        accessible={false}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
        style={[styles.container, style, { opacity }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}
