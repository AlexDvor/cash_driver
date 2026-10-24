import React from 'react';
import {
  Platform,
  requireNativeComponent,
  View,
  ViewProps,
} from 'react-native';

const AndroidPageHost = requireNativeComponent<ViewProps>(
  'CashDriverCalendarPageHost',
);

export function CalendarPageHost(props: ViewProps) {
  return Platform.OS === 'android' ? (
    <AndroidPageHost {...props} />
  ) : (
    <View {...props} />
  );
}
