import React from 'react';
import { Text } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './AppText.styles';
import { AppTextProps } from './AppText.interface';

export function AppText({
  variant = 'body',
  secondary = false,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        styles[variant],
        { color: secondary ? colors.secondaryText : colors.text },
        style,
      ]}
    />
  );
}
