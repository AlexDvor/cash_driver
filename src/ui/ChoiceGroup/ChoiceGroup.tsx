import React, { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './ChoiceGroup.styles';
import { ChoiceGroupProps } from './ChoiceGroup.interface';

export function ChoiceGroup<Value extends string>({
  appearance = 'chips',
  columns,
  disabled = false,
  label,
  options,
  value,
  onChange,
}: ChoiceGroupProps<Value>) {
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(0);
  return (
    <View style={styles.group}>
      <AppText variant="heading" accessibilityRole="header">
        {label}
      </AppText>
      <View
        style={styles.choices}
        onLayout={
          appearance === 'segmented' || columns !== undefined
            ? event => setAvailableWidth(event.nativeEvent.layout.width)
            : undefined
        }
      >
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.choice,
                appearance === 'segmented' && styles.segment,
                appearance === 'segmented' && {
                  // Wrap segments before enlarged labels become narrow columns.
                  minWidth:
                    availableWidth > 0
                      ? Math.min(
                          sizing.touchTarget * 2 * fontScale,
                          availableWidth,
                        )
                      : undefined,
                },
                columns !== undefined && {
                  width:
                    availableWidth > 0
                      ? (availableWidth - spacing.sm * (columns - 1)) / columns
                      : '100%',
                  flexGrow: 1,
                  flexShrink: 0,
                },
                {
                  backgroundColor: selected
                    ? appearance === 'segmented'
                      ? colors.primary
                      : colors.softGreen
                    : colors.card,
                  borderColor:
                    selected || pressed ? colors.primary : colors.border,
                },
                pressed && appearance === 'segmented' && styles.pressed,
              ]}
            >
              <AppText
                style={[
                  styles.label,
                  selected && styles.selected,
                  {
                    color: selected
                      ? appearance === 'segmented'
                        ? colors.onPrimary
                        : colors.primary
                      : colors.text,
                  },
                ]}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
