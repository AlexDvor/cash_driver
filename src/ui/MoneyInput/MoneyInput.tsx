import React from 'react';
import { TextInput, View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './MoneyInput.styles';
import { MoneyInputProps } from './MoneyInput.interface';

export function MoneyInput({
  inputRef,
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
        ref={inputRef}
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
