import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  saveProgress: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -spacing.sm,
  },
  section: { gap: spacing.md },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hapticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizing.touchTarget,
  },
  hapticsText: { flex: 1, gap: spacing.xs },
  storageTitle: { fontWeight: '600' },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  storageText: { flex: 1, gap: spacing.sm },
  toggleLabel: { flexShrink: 1 },
  divider: { height: sizing.borderWidth },
});
