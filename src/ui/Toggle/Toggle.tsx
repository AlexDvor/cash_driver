import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './Toggle.styles';

// Decorative switch (Figma "Toggle": 52×32 track, 26dp knob). The pressable parent
// owns the role, label and checked state; this view is hidden from accessibility.
export function Toggle({ value, testID }: { value: boolean; testID?: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      testID={testID}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.track,
        value && styles.trackOn,
        { backgroundColor: value ? colors.indicator : colors.borderStrong },
      ]}
    >
      <View
        style={[
          styles.knob,
          {
            backgroundColor: value ? colors.onIndicator : colors.secondaryText,
          },
        ]}
      />
    </View>
  );
}
