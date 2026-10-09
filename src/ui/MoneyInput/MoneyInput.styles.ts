import { StyleSheet } from 'react-native';
import { radii, sizing, spacing, typography } from '../../theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  input: {
    minHeight: sizing.primaryButton,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.money,
    fontVariant: ['tabular-nums'],
  },
});
