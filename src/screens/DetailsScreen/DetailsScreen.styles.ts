import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  value: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
