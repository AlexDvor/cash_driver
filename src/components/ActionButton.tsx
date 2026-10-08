import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { radii, sizing, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export function ActionButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: ActionButtonProps) {
  const { colors } = useAppTheme();
  const backgroundColor =
    variant === 'destructive'
      ? colors.errorSurface
      : variant === 'secondary'
      ? colors.softGreen
      : colors.primary;
  const textColor =
    variant === 'destructive'
      ? colors.errorText
      : variant === 'secondary'
      ? colors.primary
      : colors.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      {loading && <ActivityIndicator color={textColor} />}
      <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizing.primaryButton,
    borderRadius: radii.button,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  dimmed: { opacity: 0.7 },
});
