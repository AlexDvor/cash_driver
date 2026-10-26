import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  heroCard: { overflow: 'hidden', gap: spacing.md },
  heroLabel: { fontWeight: '600' },
  heroStack: { flexDirection: 'column', alignItems: 'stretch' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroCount: { flex: 1 },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  statCards: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: { padding: spacing.md, justifyContent: 'space-between' },
  statContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statText: { flex: 1, minWidth: 0, gap: spacing.sm },
  statAmount: {
    fontSize: typography.summaryStatMoney,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  heroText: { flex: 1, minWidth: 0, gap: spacing.sm },
  heroIllustration: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  money: {
    fontSize: typography.summaryMoney,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
