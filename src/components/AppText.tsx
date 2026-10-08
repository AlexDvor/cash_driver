import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/tokens';

interface AppTextProps extends TextProps {
  variant?: 'title' | 'heading' | 'body' | 'supporting';
  secondary?: boolean;
}

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

const styles = StyleSheet.create({
  title: { fontSize: typography.title, fontWeight: '700' },
  heading: { fontSize: typography.heading, fontWeight: '600' },
  body: { fontSize: typography.body },
  supporting: { fontSize: typography.supporting },
});
