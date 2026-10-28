import { StyleSheet } from 'react-native';
import {
  radii,
  sizing,
  spacing,
  typography,
  opacity,
  iconSizing,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  container: {
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  header: {
    minHeight: sizing.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  headerTitle: { fontWeight: '600' },
  pressed: { opacity: opacity.pressed },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  refreshFeedback: { gap: spacing.sm },
  refreshStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressSlot: { width: sizing.icon, height: sizing.icon },
  refreshText: { flex: 1 },
  totals: { gap: spacing.md },
  toggleCircle: {
    width: sizing.icon,
    height: sizing.icon,
    borderRadius: sizing.icon / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  circleFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: opacity.summaryCircleFill,
  },
  chevron: {
    width: iconSizing.summaryChevron,
    height: iconSizing.summaryChevron,
    borderRightWidth: iconSizing.chevronStroke,
    borderBottomWidth: iconSizing.chevronStroke,
  },
  retainedRow: {
    borderTopWidth: sizing.borderWidth,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  retainedLabel: { fontWeight: '600' },
  retainedValue: { fontSize: typography.heading, fontWeight: '700' },
  total: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
    textAlign: 'right',
    flexShrink: 1,
  },
});
