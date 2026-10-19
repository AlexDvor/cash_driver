import { StyleSheet } from 'react-native';
import {
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';
export const styles = StyleSheet.create({
  card: { gap: spacing.md },
  result: { borderRadius: radii.input, padding: spacing.sm, gap: spacing.xs },
  amount: {
    fontSize: typography.change,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  missing: { fontSize: typography.money },
  dismiss: { minHeight: sizing.touchTarget, justifyContent: 'center' },
});
