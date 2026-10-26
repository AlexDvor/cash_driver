import { StyleSheet } from 'react-native';
import {
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  compactField: { paddingHorizontal: spacing.sm },
  compactInput: { fontSize: typography.paymentMoney, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: sizing.borderWidth,
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  suffix: { fontSize: typography.heading },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: sizing.primaryButton,
    paddingVertical: spacing.sm,
    fontSize: typography.money,
    fontVariant: ['tabular-nums'],
  },
});
