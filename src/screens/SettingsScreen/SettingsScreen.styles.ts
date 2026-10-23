import { StyleSheet } from 'react-native';
import { radii, sizing, spacing, opacity } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  section: { gap: spacing.sm },
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
  destructiveAction: { borderRadius: radii.button, overflow: 'hidden' },
  destructiveBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: opacity.destructiveBackground,
  },
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
