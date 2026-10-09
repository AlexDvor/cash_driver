import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './Card.styles';

export function Card({
  children,
  style,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}
