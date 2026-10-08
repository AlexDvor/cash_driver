import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { radii, sizing, spacing, typography } from '../theme/tokens';
import { AppText } from './AppText';

interface MoneyInputProps {
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (raw: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}
export function MoneyInput({
  label,
  value,
  error,
  disabled,
  onChange,
  onFocus,
  onBlur,
}: MoneyInputProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      <AppText>{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        editable={!disabled}
        keyboardType="decimal-pad"
        placeholder="0,00"
        placeholderTextColor={colors.secondaryText}
        selectionColor={colors.primary}
        autoCorrect={false}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.background,
            borderColor: error ? colors.errorText : colors.border,
          },
        ]}
      />
      {error && (
        <AppText
          variant="supporting"
          accessibilityRole="alert"
          style={{ color: colors.errorText }}
        >
          {error}
        </AppText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  input: {
    minHeight: sizing.primaryButton,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.money,
    fontVariant: ['tabular-nums'],
  },
});
