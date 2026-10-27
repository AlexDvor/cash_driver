import { choiceLayout } from '../../constants/theme/layout';
import React, { useState, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import {
  sizing,
  spacing,
  typography,
  iconSizing,
} from '../../constants/theme/tokens';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../AppText/AppText';
import { styles } from './MultiChoiceGroup.styles';
import { SelectionIndicator } from '../SelectionIndicator/SelectionIndicator';

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
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  // Brand icon, checkbox, padding and gaps stay fixed; reserve scaled label width.
  const minimumChoiceWidth =
    iconSizing.platform +
    sizing.icon +
    spacing.md * 2 +
    spacing.sm * 2 +
    Math.max(...options.map(option => option.label.length), 0) *
      typography.body *
      choiceLayout.multiChoiceLabelCharacterWidthFactor *
      fontScale;
  const columns = width >= minimumChoiceWidth * 2 + spacing.sm ? 2 : 1;
  return (
    <View style={styles.group}>
      {!hideLabel && <AppText accessibilityRole="header">{label}</AppText>}
      {description && (
        <AppText variant="supporting" secondary>
          {description}
        </AppText>
      )}
      <View
        style={styles.choices}
        onLayout={event => setWidth(event.nativeEvent.layout.width)}
      >
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
                compact && styles.compact,
                {
                  width:
                    width > 0
                      ? Math.floor(
                          (width - spacing.sm * (columns - 1)) / columns,
                        )
                      : '100%',
                  flexGrow: 1,
                },
                {
                  backgroundColor: checked ? colors.softGreen : colors.card,
                  borderColor: checked ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              {option.icon}
              <AppText
                style={[
                  styles.choiceLabel,
                  checked && styles.checked,
                  { color: checked ? colors.primary : colors.text },
                ]}
              >
                {option.label}
              </AppText>
              <SelectionIndicator checked={checked} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
