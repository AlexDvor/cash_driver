import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Reserve readable space; the calendar trigger wraps on narrow/scaled layouts.
  label: { flexGrow: 1, flexShrink: 1, minWidth: '40%' },
  button: {
    minHeight: sizing.touchTarget,
    minWidth: sizing.touchTarget,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.chip,
  },
});
