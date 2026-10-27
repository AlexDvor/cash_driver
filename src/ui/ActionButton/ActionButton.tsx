import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './ActionButton.styles';
import { ActionButtonProps } from './ActionButton.interface';
import { SurfaceDepth } from '../SurfaceDepth/SurfaceDepth';
import { radii } from '../../constants/theme/tokens';

export function ActionButton({
  renderIcon,
  depth = false,
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: ActionButtonProps) {
  const { colors } = useAppTheme();
  const blocked = disabled || loading;
  const backgroundColor =
    variant === 'outline' || variant === 'destructive-outline'
      ? colors.transparent
      : blocked
      ? colors.disabledSurface
      : variant === 'destructive'
      ? colors.transparent
      : variant === 'secondary'
      ? colors.softGreen
      : colors.primary;
  const textColor = blocked
    ? colors.disabledText
    : variant === 'destructive' || variant === 'destructive-outline'
    ? colors.errorText
    : variant === 'secondary'
    ? colors.primary
    : variant === 'outline'
    ? colors.secondaryText
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
          borderColor: pressed
            ? textColor
            : variant === 'destructive-outline'
            ? textColor
            : variant === 'outline'
            ? colors.border
            : colors.transparent,
        },
      ]}
    >
      {depth && !blocked && variant === 'primary' && (
        <SurfaceDepth radius={radii.button} action />
      )}
      {loading && <ActivityIndicator color={textColor} />}
      {!loading && renderIcon?.(textColor)}
      <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
    </Pressable>
  );
}
