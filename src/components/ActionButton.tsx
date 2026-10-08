import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { radii, sizing, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ActionButton({
  label,
  onPress,
  disabled = false,
}: ActionButtonProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primary },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <AppText style={[styles.label, { color: colors.onPrimary }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizing.primaryButton,
    borderRadius: radii.button,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontWeight: '600', textAlign: 'center' },
  dimmed: { opacity: 0.7 },
});
