import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  container: { gap: 0 },
  rows: { gap: spacing.sm },
  groupHeading: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  card: {
    padding: spacing.md,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.chip,
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
