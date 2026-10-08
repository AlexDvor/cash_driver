import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TabParamList } from '../app/navigationTypes';
import { sizing } from '../theme/tokens';

// Small outline symbols built from native Views; no additional icon dependency.
export function TabIcon({
  name,
  color,
}: {
  name: keyof TabParamList;
  color: string;
}) {
  const outline = { borderColor: color };
  return (
    <View
      style={styles.frame}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'Home' && (
        <>
          <View style={[styles.roof, outline]} />
          <View style={[styles.house, outline]} />
        </>
      )}
      {name === 'History' && (
        <>
          <View style={[styles.circle, outline]} />
          <View style={[styles.clockHand, { backgroundColor: color }]} />
          <View style={[styles.minuteHand, { backgroundColor: color }]} />
        </>
      )}
      {name === 'Summary' && (
        <View style={styles.bars}>
          <View style={[styles.bar, styles.shortBar, outline]} />
          <View style={[styles.bar, styles.tallBar, outline]} />
          <View style={[styles.bar, styles.mediumBar, outline]} />
        </View>
      )}
      {name === 'Settings' && (
        <>
          <View style={[styles.circle, outline]} />
          <View style={[styles.innerCircle, outline]} />
          <View style={[styles.topNotch, { backgroundColor: color }]} />
          <View style={[styles.bottomNotch, { backgroundColor: color }]} />
          <View style={[styles.leftNotch, { backgroundColor: color }]} />
          <View style={[styles.rightNotch, { backgroundColor: color }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: sizing.icon, height: sizing.icon },
  circle: {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 9,
  },
  innerCircle: {
    position: 'absolute',
    left: 9,
    top: 9,
    width: 6,
    height: 6,
    borderWidth: 2,
    borderRadius: 3,
  },
  roof: {
    position: 'absolute',
    top: 4,
    left: 5,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  house: {
    position: 'absolute',
    top: 10,
    left: 4,
    width: 16,
    height: 12,
    borderWidth: 2,
    borderTopWidth: 0,
  },
  clockHand: { position: 'absolute', top: 7, left: 11, width: 2, height: 6 },
  minuteHand: { position: 'absolute', top: 12, left: 11, width: 6, height: 2 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    padding: 2,
    height: sizing.icon,
  },
  bar: { width: 4, borderWidth: 1, borderRadius: 1 },
  shortBar: { height: 10 },
  tallBar: { height: 20 },
  mediumBar: { height: 15 },
  topNotch: { position: 'absolute', top: 0, left: 11, width: 2, height: 4 },
  bottomNotch: {
    position: 'absolute',
    bottom: 0,
    left: 11,
    width: 2,
    height: 4,
  },
  leftNotch: { position: 'absolute', left: 0, top: 11, width: 4, height: 2 },
  rightNotch: { position: 'absolute', right: 0, top: 11, width: 4, height: 2 },
});
