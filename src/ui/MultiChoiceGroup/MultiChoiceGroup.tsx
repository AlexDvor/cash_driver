import React, { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../AppText/AppText';
import { Toggle } from '../Toggle/Toggle';
import { styles } from './MultiChoiceGroup.styles';

interface MultiChoiceGroupProps<Value extends string> {
  compact?: boolean;
  hideLabel?: boolean;
  label: string;
  description?: string;
  options: { value: Value; label: string; icon?: ReactNode }[];
  values: readonly Value[];
  disabled?: boolean;
  lastChoiceHint: string;
  onToggle: (value: Value) => void;
}

// One row per option with a decorative switch (Figma Ajustes "PlatformToggle").
// Semantics stay a checkbox group: checked state, last-choice protection and hint.
export function MultiChoiceGroup<Value extends string>({
  compact = false,
  hideLabel = false,
  label,
  description,
  options,
  values,
  disabled = false,
  lastChoiceHint,
  onToggle,
}: MultiChoiceGroupProps<Value>) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      {!hideLabel && <AppText accessibilityRole="header">{label}</AppText>}
      {description && (
        <AppText variant="supporting" secondary style={styles.description}>
          {description}
        </AppText>
      )}
      <View>
        {options.map((option, index) => {
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
                compact && styles.compact,
                index > 0 && [
                  styles.divided,
                  { borderTopColor: colors.border },
                ],
                pressed && styles.pressed,
              ]}
            >
              {option.icon}
              <AppText style={styles.choiceLabel}>{option.label}</AppText>
              <Toggle value={checked} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
