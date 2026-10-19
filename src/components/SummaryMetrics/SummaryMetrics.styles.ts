import { StyleSheet } from 'react-native';
import {
  gradients,
  radii,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  heroCard: { overflow: 'hidden', gap: spacing.md },
  heroStack: { flexDirection: 'column', alignItems: 'stretch' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroCount: { flex: 1 },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundImage: gradients.summaryHeroOverlay,
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
  heroText: { flex: 1, gap: spacing.md },
  heroIllustration: {
    alignSelf: 'flex-end',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.md,
  },
  label: { flexShrink: 1 },
  iconBadge: { padding: spacing.xs, borderRadius: radii.input },
  value: {
    width: '40%',
    flexShrink: 0,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
    textAlign: 'right',
  },
});
