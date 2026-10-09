import React from 'react';
import { View } from 'react-native';
import { TabParamList } from '../../navigation/navigationTypes';
import { routes } from '../../navigation/routes';
import { styles } from './TabIcon.styles';

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
      {name === routes.Home && (
        <>
          <View style={[styles.roof, outline]} />
          <View style={[styles.house, outline]} />
        </>
      )}
      {name === routes.History && (
        <>
          <View style={[styles.circle, outline]} />
          <View style={[styles.clockHand, { backgroundColor: color }]} />
          <View style={[styles.minuteHand, { backgroundColor: color }]} />
        </>
      )}
      {name === routes.Summary && (
        <View style={styles.bars}>
          <View style={[styles.bar, styles.shortBar, outline]} />
          <View style={[styles.bar, styles.tallBar, outline]} />
          <View style={[styles.bar, styles.mediumBar, outline]} />
        </View>
      )}
      {name === routes.Settings && (
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
