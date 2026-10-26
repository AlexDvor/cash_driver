import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../constants/theme/tokens';
export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  title: { fontSize: typography.homeTitle, fontWeight: '700' },
});
