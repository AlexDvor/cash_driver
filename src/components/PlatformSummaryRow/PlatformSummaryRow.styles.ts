import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

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
  brandBadge: {
    // Preserve Cabify's minimum wordmark size and half-height clear space.
    width: sizing.touchTarget * 2 + spacing.lg,
    height: sizing.touchTarget + spacing.md,
    padding: spacing.lg,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.chip,
  },
  brandImage: { width: '100%', height: '100%' },
});
