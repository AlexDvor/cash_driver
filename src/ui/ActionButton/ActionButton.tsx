import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './ActionButton.styles';
import { ActionButtonProps } from './ActionButton.interface';

// Pill buttons (redesign 2026-11): flat fills, no gradient depth.
// `depth` stays in the props for call-site compatibility and has no visual effect.
export function ActionButton({
  compact = false,
  renderIcon,
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: ActionButtonProps) {
  const { colors } = useAppTheme();
  const blocked = disabled || loading;
  const backgroundColor = blocked
    ? variant === 'outline' || variant === 'destructive-outline'
      ? colors.transparent
      : colors.disabledSurface
    : variant === 'primary'
    ? colors.accentFill
    : variant === 'secondary'
    ? colors.surfaceRaised
    : variant === 'destructive'
    ? colors.errorSurface
    : colors.transparent;
  const textColor = blocked
    ? colors.disabledText
    : variant === 'destructive' || variant === 'destructive-outline'
    ? colors.errorText
    : variant === 'secondary'
    ? colors.text
    : variant === 'outline'
    ? colors.secondaryText
    : colors.onAccent;
  const restingBorder =
    variant === 'secondary' || variant === 'outline'
      ? colors.borderStrong
      : variant === 'destructive-outline'
      ? colors.errorText
      : colors.transparent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        { backgroundColor, borderColor: restingBorder },
        pressed && styles.pressed,
      ]}
    >
      {loading && <ActivityIndicator color={textColor} />}
      {!loading && renderIcon?.(textColor)}
      <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
    </Pressable>
  );
}
