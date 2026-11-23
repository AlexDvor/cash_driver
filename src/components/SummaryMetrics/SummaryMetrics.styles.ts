import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  heroCard: { gap: spacing.lg },
  medallionHalo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexShrink: 0,
  },
  medallionCore: { alignItems: 'center', justifyContent: 'center' },
  plate: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statCards: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statAmountScroll: { flexGrow: 0 },
  statContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statText: { flex: 1, minWidth: 0, gap: spacing.xs },
  statAmount: {
    fontSize: typography.summaryStatMoney,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroText: { flex: 1, minWidth: 0, gap: spacing.xs },
  money: {
    fontSize: typography.summaryMoney,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  moneyHidden: { opacity: 0 },
  // Wide on purpose: the in-flight number may be wider than the real one and must not wrap.
  moneyOverlay: { position: 'absolute', left: 0, top: 0, width: 1200 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
