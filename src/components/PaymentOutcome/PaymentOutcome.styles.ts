import { StyleSheet } from 'react-native';
import {
  letterSpacing,
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';
export const styles = StyleSheet.create({
  card: { gap: spacing.md },
  cancelContent: { paddingTop: spacing.md },
  // Receipt card: flat surface, hairline border, large radius (Figma PaymentOutcome).
  result: {
    padding: spacing.xl,
    gap: spacing.sm,
    borderRadius: radii.cardLarge,
    borderWidth: sizing.borderWidth,
  },
  receiptHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  receiptTitle: {
    flex: 1,
    fontSize: typography.overline,
    fontWeight: '600',
    letterSpacing: letterSpacing.overline,
    textTransform: 'uppercase',
  },
  details: {
    borderTopWidth: sizing.borderWidth,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
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
    letterSpacing: letterSpacing.money,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  missing: { fontSize: typography.money },
  dismiss: { minHeight: sizing.touchTarget, justifyContent: 'center' },
});
