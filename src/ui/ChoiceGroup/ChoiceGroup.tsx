import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';

import { AppText } from '../AppText/AppText';
import { styles } from './ChoiceGroup.styles';
import { ChoiceGroupProps } from './ChoiceGroup.interface';

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
                  borderColor:
                    selected || pressed ? colors.primary : colors.border,
                },
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
