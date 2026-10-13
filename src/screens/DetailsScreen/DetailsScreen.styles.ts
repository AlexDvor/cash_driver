import { StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  platformHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headingText: { flex: 1, gap: spacing.xs },
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
