import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { radii, sizing, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface ChoiceGroupProps<Value extends string> {
  columns?: 2 | 4;
  disabled?: boolean;
  label: string;
  options: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}

export function ChoiceGroup<Value extends string>({
  columns,
  disabled = false,
  label,
  options,
  value,
  onChange,
}: ChoiceGroupProps<Value>) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      <AppText variant="heading" accessibilityRole="header">
        {label}
      </AppText>
      <View style={styles.choices}>
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
                columns !== undefined && {
                  flexBasis: columns === 2 ? '40%' : '20%',
                  flexGrow: 1,
                },
                {
                  backgroundColor: selected ? colors.softGreen : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[
                  styles.label,
                  selected && styles.selected,
                  { color: selected ? colors.primary : colors.text },
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

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    minHeight: sizing.touchTarget,
    borderRadius: radii.chip,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  label: { textAlign: 'center' },
  selected: { fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
