import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  heroCard: { overflow: 'hidden' },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundImage:
      'radial-gradient(ellipse at 82% 38%, rgba(255, 255, 255, 0.19) 0%, transparent 68%), linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 35%, rgba(0, 0, 0, 0.23) 100%)',
  },
  statCards: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  heroText: { flex: 1, gap: spacing.lg },
  heroIllustration: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  money: {
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
  value: {
    flexShrink: 1,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
    textAlign: 'right',
  },
});
