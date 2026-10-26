import { StyleSheet } from 'react-native';
import { sizing, spacing, typography } from '../../constants/theme/tokens';
export const styles = StyleSheet.create({
  card: { gap: spacing.md },
  cancelContent: { paddingTop: spacing.md },
  result: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  receiptHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  receiptTitle: { fontWeight: '700', flex: 1 },
  details: {
    borderTopWidth: sizing.borderWidth,
    borderStyle: 'dashed',
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detailLabel: { flexShrink: 1 },
  detailValue: {
    marginLeft: 'auto',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  amount: {
    fontSize: typography.change,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  missing: { fontSize: typography.money },
  dismiss: { minHeight: sizing.touchTarget, justifyContent: 'center' },
});
