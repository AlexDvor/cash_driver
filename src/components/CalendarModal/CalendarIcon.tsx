import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { sizing } from '../../constants/theme/tokens';
import { styles } from './CalendarModal.styles';
import CalendarSvg from '../../assets/icons/duotone/calendar.svg';
import ChevronLeft from '../../assets/icons/line/chevron-left.svg';
import ChevronRight from '../../assets/icons/line/chevron-right.svg';

const decorative = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const;

export function CalendarIcon() {
  const { colors } = useAppTheme();
  return (
    <View {...decorative} style={styles.icon}>
      <CalendarSvg
        width={sizing.icon}
        height={sizing.icon}
        color={colors.primary}
      />
    </View>
  );
}

export function CalendarChevron({
  color,
  previous = false,
}: {
  color: string;
  previous?: boolean;
}) {
  const Chevron = previous ? ChevronLeft : ChevronRight;
  return (
    <View {...decorative} style={styles.chevron}>
      <Chevron width={sizing.icon} height={sizing.icon} color={color} />
    </View>
  );
}
