import { StyleSheet } from 'react-native';
import {
  fontFamily,
  letterSpacing,
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontSize: typography.caption },
  compactField: { paddingHorizontal: spacing.md },
  compactInput: {
    fontSize: typography.paymentMoney,
    fontWeight: '700',
    letterSpacing: letterSpacing.money / 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: sizing.borderWidth,
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  // Focus/error keep the same outer size: the thicker border eats into padding.
  emphasisedField: { borderWidth: 1.5 },
  suffix: { fontSize: typography.body, fontWeight: '600' },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: sizing.primaryButton,
    paddingVertical: spacing.sm,
    fontFamily,
    fontSize: typography.money,
    fontWeight: '700',
    letterSpacing: letterSpacing.money,
    fontVariant: ['tabular-nums'],
  },
});
