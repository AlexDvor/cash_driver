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
  },
  content: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekdays: { flexDirection: 'row' },
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
  day: {
    minWidth: sizing.touchTarget,
    minHeight: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  ring: {
    borderRadius: sizing.touchTarget,
    padding: spacing.xs,
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
