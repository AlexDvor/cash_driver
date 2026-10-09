import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme/tokens';

export const styles = StyleSheet.create({
  money: {
    fontSize: typography.money,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  value: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
