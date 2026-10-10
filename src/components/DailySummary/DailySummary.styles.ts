import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  container: {
    borderRadius: radii.input,
    padding: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1 },
  pressed: { opacity: 0.7 },
  content: { paddingTop: spacing.md, gap: spacing.md },
  totals: { gap: spacing.sm },
  total: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
