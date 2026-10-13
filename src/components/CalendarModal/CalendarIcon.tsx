import React from 'react';
import { Image, View } from 'react-native';
import { styles } from './CalendarModal.styles';

export function CalendarIcon() {
  return (
    <Image
      source={require('../../assets/icons/calendar-3d.png')}
      resizeMode="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.icon}
    />
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
