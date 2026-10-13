import { StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.md,
  },
  label: { flexShrink: 1 },
  value: { flexShrink: 1, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
