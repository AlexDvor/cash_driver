import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './MoneyInput.styles';
import { MoneyInputProps } from './MoneyInput.interface';

export function MoneyInput({
  showCurrency = false,
  compact = false,
  onLayout,
  inputRef,
  groupRef,
  label,
  hideLabel = false,
  value,
  error,
  disabled,
  onChange,
  onFocus,
  onBlur,
}: MoneyInputProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      onLayout={onLayout}
      ref={groupRef}
      collapsable={groupRef ? false : undefined}
      style={styles.group}
    >
      {!hideLabel && (
        <AppText variant="supporting" secondary style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.field,
          compact && styles.compactField,
          (focused || Boolean(error)) && styles.emphasisedField,
          {
            backgroundColor: colors.fieldSurface,
            borderColor: error
              ? colors.errorText
              : focused
              ? colors.primary
              : colors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error}
          value={value}
          onChangeText={onChange}
          onFocus={() => {
            setFocused(true);
            onFocus();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          editable={!disabled}
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={colors.tertiaryText}
          selectionColor={colors.primary}
          autoCorrect={false}
          style={[
            styles.input,
            compact && styles.compactInput,
            {
              color: colors.text,
            },
          ]}
        />
        {showCurrency && (
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
          >
            <AppText style={[styles.suffix, { color: colors.tertiaryText }]}>
              €
            </AppText>
          </View>
        )}
      </View>
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
