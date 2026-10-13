import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.6,
  },
  panel: {
    width: '100%',
    maxWidth: sizing.contentMaxWidth,
    borderRadius: radii.card,
    borderWidth: sizing.borderWidth,
    overflow: 'hidden',
  },
  content: { padding: spacing.xxl, gap: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekdays: { flexDirection: 'row' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendLabel: { flex: 1 },
  legendDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: spacing.md / 2,
  },
  centered: { textAlign: 'center' },
  calendar: { paddingLeft: 0, paddingRight: 0 },
  heading: { flex: 1 },
  control: {
    minWidth: sizing.touchTarget,
    minHeight: sizing.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.chip,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  month: { flexGrow: 1, flexBasis: '30%' },
  selectedMonth: { fontWeight: '700' },
  pickerPreview: { textAlign: 'center', marginTop: spacing.sm },
  // Transparent artwork has inner padding; 32 keeps its visible calendar
  // readable inside the existing 48-unit button with 8-unit outer padding.
  icon: { width: 32, height: 32, flexShrink: 0 },
  chevron: { width: 10, height: 10, borderTopWidth: 2, borderRightWidth: 2 },
  day: {
    minWidth: sizing.touchTarget,
    minHeight: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderRadius: sizing.touchTarget,
    padding: spacing.xs / 2,
    borderWidth: 2,
  },
  circle: {
    minWidth: sizing.touchTarget - spacing.sm,
    minHeight: sizing.touchTarget - spacing.sm,
    borderRadius: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    borderWidth: sizing.borderWidth,
  },
});
