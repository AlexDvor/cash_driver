import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    borderRadius: radii.input,
    padding: spacing.lg,
    gap: spacing.md,
  },
  totals: { gap: spacing.sm },
  total: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
