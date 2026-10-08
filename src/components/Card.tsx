import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { radii, sizing, spacing } from '../theme/tokens';

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

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: sizing.borderWidth,
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
