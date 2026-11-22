import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizing.primaryButton,
    borderRadius: radii.button,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compact: { minHeight: sizing.touchTarget, paddingVertical: spacing.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: { fontWeight: '600', textAlign: 'center', flexShrink: 1 },
});
