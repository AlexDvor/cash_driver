import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './ActionButton.styles';
import { ActionButtonProps } from './ActionButton.interface';

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
        { backgroundColor, borderColor: pressed ? textColor : 'transparent' },
        disabled && styles.dimmed,
      ]}
    >
      {loading && <ActivityIndicator color={textColor} />}
      <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
    </Pressable>
  );
}
