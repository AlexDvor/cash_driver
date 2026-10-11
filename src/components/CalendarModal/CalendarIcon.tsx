import React from 'react';
import { View } from 'react-native';
import { styles } from './CalendarModal.styles';

// Match the app's native View outline icons without another dependency.
export function CalendarIcon({ color }: { color: string }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.icon}
    >
      <View style={[styles.calendarOutline, { borderColor: color }]} />
      <View style={[styles.calendarRule, { backgroundColor: color }]} />
      <View style={[styles.calendarBindingLeft, { backgroundColor: color }]} />
      <View style={[styles.calendarBindingRight, { backgroundColor: color }]} />
    </View>
  );
}

export function CalendarChevron({
  color,
  previous = false,
}: {
  color: string;
  previous?: boolean;
}) {
  return (
    <View
      accessible={false}
      style={[
        styles.chevron,
        {
          borderColor: color,
          transform: [{ rotate: previous ? '225deg' : '45deg' }],
        },
      ]}
    />
  );
}
