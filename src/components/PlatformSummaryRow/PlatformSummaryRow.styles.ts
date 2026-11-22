import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  row: {
    minHeight: sizing.touchTarget,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  main: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.md,
  },
  label: { flexShrink: 1 },
  valueColumn: { width: '40%', flexShrink: 0, marginLeft: 'auto' },
  value: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  percent: { textAlign: 'right', fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});
