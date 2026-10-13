import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    minHeight: sizing.touchTarget,
    borderRadius: radii.chip,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  choiceLabel: { textAlign: 'center', flexShrink: 1 },
  checked: { fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
