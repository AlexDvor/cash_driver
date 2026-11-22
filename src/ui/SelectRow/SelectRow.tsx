import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { CollapsibleContent } from '../../components/CollapsibleContent/CollapsibleContent';
import { AppText } from '../AppText/AppText';
import ChevronDown from '../../assets/icons/line/chevron-down.svg';
import Check from '../../assets/icons/line/check.svg';
import { styles } from './SelectRow.styles';

export interface SelectRowProps<Value extends string> {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  disabled?: boolean;
  testID?: string;
}

// "Label · Value ⌄" settings row that expands into a full-width option list.
// Full-width rows keep every label on one line at any font scale or screen width.
// Options are radios (role, label, selected/disabled state) like ChoiceGroup.
export function SelectRow<Value extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  testID = 'select-row',
}: SelectRowProps<Value>) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const current = options.find(option => option.value === value)?.label ?? '';
  return (
    <View>
      <Pressable
        testID={`${testID}-toggle`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: current }}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(isOpen => !isOpen)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <AppText style={styles.label}>{label}</AppText>
        <View style={styles.trailing}>
          <AppText secondary numberOfLines={1} style={styles.value}>
            {current}
          </AppText>
          <ChevronDown
            width={18}
            height={18}
            color={colors.tertiaryText}
            accessible={false}
            style={open ? styles.chevronOpen : undefined}
          />
        </View>
      </Pressable>
      <CollapsibleContent
        expanded={open}
        resetCount={0}
        testID={`${testID}-options`}
      >
        <View style={styles.list}>
          {options.map(option => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected
                      ? colors.softGreen
                      : colors.surfaceRaised,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  style={[styles.optionLabel, selected && styles.selected]}
                >
                  {option.label}
                </AppText>
                {selected && (
                  <Check
                    width={20}
                    height={20}
                    color={colors.primary}
                    accessible={false}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </CollapsibleContent>
    </View>
  );
}
