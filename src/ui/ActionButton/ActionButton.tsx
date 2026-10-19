import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

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
  const blocked = disabled || loading;
  const backgroundColor = blocked
    ? colors.disabledSurface
    : variant === 'destructive'
    ? colors.transparent
    : variant === 'secondary'
    ? colors.softGreen
    : colors.primary;
  const textColor = blocked
    ? colors.disabledText
    : variant === 'destructive'
    ? colors.errorText
    : variant === 'secondary'
    ? colors.primary
    : colors.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: pressed ? textColor : colors.transparent,
        },
      ]}
    >
      {loading && <ActivityIndicator color={textColor} />}
      <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
    </Pressable>
  );
}
