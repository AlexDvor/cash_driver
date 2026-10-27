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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: sizing.touchTarget,
    paddingVertical: spacing.md,
  },
  toggleLabel: { flexShrink: 1 },
  versionError: { paddingVertical: spacing.md },
  divider: { height: sizing.borderWidth },
});
