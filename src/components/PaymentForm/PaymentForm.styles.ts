import { StyleSheet } from 'react-native';
import {
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quick: {
    minHeight: sizing.touchTarget,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.chip,
    padding: spacing.md,
    justifyContent: 'center',
    flexShrink: 1,
  },
  pressed: { opacity: 0.7 },
  result: { borderRadius: radii.input, padding: spacing.lg, gap: spacing.sm },
  amount: {
    fontSize: typography.change,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  missing: { fontSize: typography.money },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tipLabel: { flex: 1 },
  tipControl: {
    minHeight: sizing.touchTarget,
    minWidth: sizing.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismiss: { minHeight: sizing.touchTarget, justifyContent: 'center' },
});
