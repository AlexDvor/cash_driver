import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  platformHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headingText: { flex: 1, gap: spacing.xs },
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: sizing.borderWidth,
  },
  amount: {
    marginLeft: 'auto',
    textAlign: 'right',
    flexShrink: 1,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  total: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.input,
  },
  totalLabel: { fontWeight: '600' },
});
