import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './Card.styles';

// Flat surface with a hairline border (redesign 2026-11: no gradient depth).
// `depth` is kept for call-site compatibility and only selects the larger radius.
export function Card({
  children,
  style,
  depth = false,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; depth?: boolean }>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        depth && styles.large,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}
