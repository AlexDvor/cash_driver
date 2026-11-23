import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// Decorative vertical-ish gradient that fills its (relatively positioned) parent
// and is clipped to the given corner radius. Always opaque.
export function GradientFill({
  id,
  from,
  to,
  radius,
}: {
  id: string;
  from: string;
  to: string;
  radius: number;
}) {
  return (
    <View pointerEvents="none" style={[styles.clip, { borderRadius: radius }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
