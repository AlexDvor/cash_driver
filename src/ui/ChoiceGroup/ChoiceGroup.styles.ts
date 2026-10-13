import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.md },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    minHeight: sizing.touchTarget,
    borderRadius: radii.chip,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  label: { textAlign: 'center' },
  segment: {
    flexBasis: 'auto',
    flexGrow: 1,
    borderRadius: radii.button,
  },
  pressed: { opacity: 0.8 },
  selected: { fontWeight: '700' },
});
