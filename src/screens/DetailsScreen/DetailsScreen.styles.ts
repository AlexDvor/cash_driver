import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  platformHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headingText: { flex: 1, gap: spacing.xs },
  hero: { gap: spacing.xs },
  heroMain: { gap: spacing.xs },
  heroAmount: {
    fontSize: typography.summaryMoney,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  valueLabel: { flexShrink: 1 },
  amount: {
    marginLeft: 'auto',
    textAlign: 'right',
    flexShrink: 1,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
