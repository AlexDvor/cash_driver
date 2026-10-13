import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../AppText/AppText';
import { styles } from './MultiChoiceGroup.styles';

interface MultiChoiceGroupProps<Value extends string> {
  label: string;
  options: { value: Value; label: string }[];
  values: readonly Value[];
  disabled?: boolean;
  lastChoiceHint: string;
  onToggle: (value: Value) => void;
}

export function MultiChoiceGroup<Value extends string>({
  label,
  options,
  values,
  disabled = false,
  lastChoiceHint,
  onToggle,
}: MultiChoiceGroupProps<Value>) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      <AppText variant="heading" accessibilityRole="header">
        {label}
      </AppText>
      <View style={styles.choices}>
        {options.map(option => {
          const checked = values.includes(option.value);
          const lastChoice = checked && values.length === 1;
          const choiceDisabled = disabled || lastChoice;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityLabel={option.label}
              accessibilityHint={lastChoice ? lastChoiceHint : undefined}
              accessibilityState={{ checked, disabled: choiceDisabled }}
              disabled={choiceDisabled}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => [
                styles.choice,
                {
                  backgroundColor: checked ? colors.softGreen : colors.card,
                  borderColor: checked ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[
                  styles.choiceLabel,
                  checked && styles.checked,
                  { color: checked ? colors.primary : colors.text },
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
