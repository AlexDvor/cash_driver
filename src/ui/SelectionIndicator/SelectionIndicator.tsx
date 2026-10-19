import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { AppText } from '../AppText/AppText';
import { styles } from './SelectionIndicator.styles';

export function SelectionIndicator({
  checked,
  round = false,
}: {
  checked: boolean;
  round?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.indicator,
        round && styles.round,
        round && !checked && styles.hidden,
        {
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : colors.transparent,
        },
      ]}
    >
      <AppText style={[styles.check, { color: colors.onPrimary }]}>
        {checked ? '✓' : ''}
      </AppText>
    </View>
  );
}
