import { StyleSheet } from 'react-native';
import { radii, sizing, spacing, opacity } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    minHeight: sizing.primaryButton,
    borderRadius: radii.chip,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexShrink: 1,
  },
  choiceLabel: { flex: 1, flexShrink: 1 },
  checked: { fontWeight: '700' },
  pressed: { opacity: opacity.choicePressed },
});
