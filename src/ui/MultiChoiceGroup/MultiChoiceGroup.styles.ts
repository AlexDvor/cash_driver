import { StyleSheet } from 'react-native';
import {
  sizing,
  spacing,
  opacity,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  description: { fontSize: typography.caption },
  choice: {
    minHeight: sizing.primaryButton,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  compact: { minHeight: sizing.touchTarget },
  divided: { borderTopWidth: sizing.borderWidth },
  choiceLabel: { flex: 1, flexShrink: 1 },
  pressed: { opacity: opacity.choicePressed },
});
