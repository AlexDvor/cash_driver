import { StyleSheet } from 'react-native';
import {
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  container: {
    borderRadius: radii.input,
    padding: spacing.lg,
  },
  header: {
    minHeight: sizing.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  pressed: { opacity: 0.7 },
  content: { paddingTop: spacing.md, gap: spacing.md },
  refreshFeedback: { gap: spacing.sm },
  hiddenFeedback: { opacity: 0 },
  refreshStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressSlot: { width: sizing.icon, height: sizing.icon },
  refreshText: { flex: 1 },
  totals: { gap: spacing.md },
  toggleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    opacity: 0.12,
  },
  chevron: { width: 9, height: 9, borderRightWidth: 2, borderBottomWidth: 2 },
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
