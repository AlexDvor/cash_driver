import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: sizing.touchTarget,
  },
  toggleLabel: { flexShrink: 1 },
});
