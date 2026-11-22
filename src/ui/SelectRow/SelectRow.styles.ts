import { StyleSheet } from 'react-native';
import { opacity, radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizing.touchTarget,
  },
  label: { flexShrink: 1 },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
    flexShrink: 1,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  list: { gap: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: sizing.touchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.input,
    borderWidth: sizing.borderWidth,
  },
  optionLabel: { flexShrink: 1 },
  selected: { fontWeight: '600' },
  pressed: { opacity: opacity.pressed },
});
