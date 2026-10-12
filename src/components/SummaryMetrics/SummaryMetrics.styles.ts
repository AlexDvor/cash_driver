import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  statCards: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  statCard: { padding: spacing.md },
  statContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statText: { flex: 1, gap: spacing.xs },
  statAmount: {
    fontSize: typography.heading,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  heroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.lg,
  },
  money: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: typography.change,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.md,
  },
  label: { flexShrink: 1 },
  iconBadge: { padding: spacing.xs, borderRadius: radii.input },
  value: { flexShrink: 1, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
