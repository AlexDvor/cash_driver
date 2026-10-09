import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  group: { gap: spacing.md },
  row: {
    borderWidth: sizing.borderWidth,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: sizing.touchTarget,
  },
  rowContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amounts: { flexShrink: 1, gap: spacing.xs },
  pressed: { opacity: 0.7 },
});
