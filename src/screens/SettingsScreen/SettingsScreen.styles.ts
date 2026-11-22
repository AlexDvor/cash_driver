import { StyleSheet } from 'react-native';
import {
  letterSpacing,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  saveProgress: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -spacing.sm,
  },
  // Group = uppercase title above a flat card (Figma "Group/…").
  group: { gap: spacing.sm },
  groupTitle: {
    paddingHorizontal: spacing.xs,
    fontSize: typography.overline,
    fontWeight: '600',
    letterSpacing: letterSpacing.overline,
    textTransform: 'uppercase',
  },
  section: { gap: spacing.md },
  help: { fontSize: typography.caption },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  footerText: { fontSize: typography.caption },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizing.touchTarget,
  },
  switchText: { flex: 1, gap: spacing.xs },
  // Read-only label/value row: no touch-target minimum height.
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  valueLabel: { flexShrink: 1 },
  // Content placed under a card (preview / delete actions).
  after: { gap: spacing.sm, marginTop: spacing.xs },
  value: { marginLeft: 'auto', fontVariant: ['tabular-nums'] },
  storageTitle: { fontWeight: '600' },
  storageText: { gap: spacing.xs },
  divider: { height: sizing.borderWidth },
});
