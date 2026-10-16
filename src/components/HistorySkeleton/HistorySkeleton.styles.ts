import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  container: { gap: 0 },
  rows: { gap: spacing.md },
  groupHeading: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  card: {
    padding: spacing.lg,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.card,
    minHeight: sizing.touchTarget,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  details: { flex: 1, gap: spacing.xs },
});
