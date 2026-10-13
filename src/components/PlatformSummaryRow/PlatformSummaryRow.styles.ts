import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: sizing.touchTarget,
    paddingVertical: spacing.md,
  },
  divider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: sizing.borderWidth,
  },
  iconSlot: { width: sizing.icon, height: sizing.icon, flexShrink: 0 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.md,
  },
  label: { flexShrink: 1 },
  value: {
    flexShrink: 1,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
    textAlign: 'right',
  },
});
