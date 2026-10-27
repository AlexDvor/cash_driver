import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizing.primaryButton,
    borderRadius: radii.button,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontWeight: '600', textAlign: 'center', flexShrink: 1 },
});
